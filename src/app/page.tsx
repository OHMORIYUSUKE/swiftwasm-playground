'use client';

import dynamic from 'next/dynamic';

// SwiftPlaygroundをSSRなしで動的インポート
const SwiftPlayground = dynamic(() => import('@/components/SwiftPlayground'), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">SwiftWasm Playgroundを読み込み中...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <SwiftPlayground />
    </div>
  );
}
