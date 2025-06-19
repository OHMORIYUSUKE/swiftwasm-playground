import Vapor
import Foundation

// Configure your application
var env = try Environment.detect()
try LoggingSystem.bootstrap(from: &env)
let app = Application(env)
defer { app.shutdown() }

// Enable CORS for all origins and methods
app.middleware.use(CORSMiddleware(configuration: .init(
    allowedOrigin: .all,
    allowedMethods: [.GET, .POST, .PUT, .OPTIONS, .DELETE, .PATCH],
    allowedHeaders: [.accept, .authorization, .contentType, .origin, .xRequestedWith, .userAgent, .accessControlAllowOrigin]
)))

// Swift compilation endpoint
app.post("compile") { req -> EventLoopFuture<Response> in
    struct CompileRequest: Content {
        let code: String
    }
    
    struct CompileResponse: Content {
        let success: Bool
        let output: String
        let error: String?
        let wasmBase64: String?
    }
    
    do {
        let compileReq = try req.content.decode(CompileRequest.self)
        
        return req.eventLoop.future().flatMapThrowing {
            // Create temporary Swift package for compilation
            let tempDir = FileManager.default.temporaryDirectory
            let packageDir = tempDir.appendingPathComponent("temp_package_\(UUID().uuidString)")
            let swiftFile = packageDir.appendingPathComponent("Sources/main.swift")
            
            try FileManager.default.createDirectory(at: packageDir, withIntermediateDirectories: true)
            try FileManager.default.createDirectory(at: swiftFile.deletingLastPathComponent(), withIntermediateDirectories: true)
            
            // Write Package.swift
            let packageContent = """
                // swift-tools-version: 6.1
                import PackageDescription
                
                let package = Package(
                    name: "TempPackage",
                    platforms: [.macOS(.v12)],
                    products: [
                        .executable(name: "main", targets: ["main"])
                    ],
                    targets: [
                        .executableTarget(name: "main")
                    ]
                )
                """
            try packageContent.write(to: packageDir.appendingPathComponent("Package.swift"), atomically: true, encoding: .utf8)
            
            // Write Swift code to file
            try compileReq.code.write(to: swiftFile, atomically: true, encoding: .utf8)
            
            // Compile with SwiftWasm SDK
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
            process.arguments = [
                "swift", "build",
                "--swift-sdk", "wasm32-unknown-wasi",
                "--package-path", packageDir.path,
                "--scratch-path", packageDir.appendingPathComponent(".build").path
            ]
            
            let pipe = Pipe()
            let errorPipe = Pipe()
            process.standardOutput = pipe
            process.standardError = errorPipe
            process.currentDirectoryURL = packageDir
            
            try process.run()
            process.waitUntilExit()
            
            let outputData = pipe.fileHandleForReading.readDataToEndOfFile()
            let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
            
            let output = String(data: outputData, encoding: .utf8) ?? ""
            let errorOutput = String(data: errorData, encoding: .utf8) ?? ""
            
            // Find the built WASM file
            let wasmFile = packageDir.appendingPathComponent(".build/wasm32-unknown-wasi/debug/main.wasm")
            var wasmBase64: String?
            
            if FileManager.default.fileExists(atPath: wasmFile.path) {
                let wasmData = try Data(contentsOf: wasmFile)
                wasmBase64 = wasmData.base64EncodedString()
            }
            
            // Clean up temporary files
            // try? FileManager.default.removeItem(at: packageDir)
            
            let success = process.terminationStatus == 0 && wasmBase64 != nil
            
            // デバッグ情報を含める
            var debugInfo = """
                Compilation Details:
                - Exit Status: \(process.terminationStatus)
                - WASM File Exists: \(FileManager.default.fileExists(atPath: wasmFile.path))
                - WASM File Path: \(wasmFile.path)
                - Package Dir: \(packageDir.path)
                """
            
            if !success {
                debugInfo += "\n- stdout: \(output)"
                debugInfo += "\n- stderr: \(errorOutput)"
            }
            
            let response = CompileResponse(
                success: success,
                output: success ? "Compilation successful" : debugInfo,
                error: success ? nil : (errorOutput.isEmpty ? "Unknown compilation error" : errorOutput),
                wasmBase64: wasmBase64
            )
            
            return try Response(status: .ok, body: .init(data: JSONEncoder().encode(response)))
        }
    } catch {
        let errorResponse = CompileResponse(
            success: false,
            output: "",
            error: "Failed to decode request: \(error.localizedDescription)",
            wasmBase64: nil
        )
        
        return req.eventLoop.future(try Response(
            status: .badRequest,
            body: .init(data: JSONEncoder().encode(errorResponse))
        ))
    }
}

// Health check endpoint
app.get("health") { req in
    struct HealthResponse: Content {
        let status: String
        let service: String
    }
    
    return HealthResponse(status: "ok", service: "SwiftWasm Compiler Server")
}

// SwiftWasm SDK test endpoint
app.get("test-sdk") { req in
    struct SDKTestResponse: Content {
        let status: String
        let exitCode: Int?
        let sdks: String?
        let error: String?
        let message: String?
    }
    
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    process.arguments = ["swift", "sdk", "list"]
    
    let pipe = Pipe()
    let errorPipe = Pipe()
    process.standardOutput = pipe
    process.standardError = errorPipe
    
    do {
        try process.run()
        process.waitUntilExit()
        
        let outputData = pipe.fileHandleForReading.readDataToEndOfFile()
        let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
        
        let output = String(data: outputData, encoding: .utf8) ?? ""
        let errorOutput = String(data: errorData, encoding: .utf8) ?? ""
        
        return SDKTestResponse(
            status: "tested",
            exitCode: Int(process.terminationStatus),
            sdks: output,
            error: errorOutput.isEmpty ? nil : errorOutput,
            message: nil
        )
    } catch {
        return SDKTestResponse(
            status: "error",
            exitCode: nil,
            sdks: nil,
            error: nil,
            message: error.localizedDescription
        )
    }

}
// Default route
app.get { req in
    return "SwiftWasm Compiler Server is running!"
}

print("Starting SwiftWasm Compiler Server on port 8080...")
try app.run()

