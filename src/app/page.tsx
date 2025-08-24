export default function HomePage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">
        SuperLee AI Agent ✅
      </h1>
      
      <p className="text-lg mb-6">
        Development server berjalan dengan baik!
      </p>

      <div className="bg-green-100 p-4 rounded-lg">
        <p>Environment Variables Loaded:</p>
        <ul className="text-sm mt-2">
          <li>Chain ID: {process.env.NEXT_PUBLIC_STORY_CHAIN_ID || 'Not set'}</li>
          <li>RPC: {process.env.NEXT_PUBLIC_STORY_RPC || 'Not set'}</li>
          <li>SPG: {process.env.NEXT_PUBLIC_SPG_COLLECTION ? '✅ Set' : '❌ Not set'}</li>
          <li>Pinata: {process.env.PINATA_JWT ? '✅ Set' : '❌ Not set'}</li>
        </ul>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>Jika halaman ini muncul dengan cepat, berarti basic setup sudah OK!</p>
        <p>Masalah lambat kemungkinan dari Web3 dependencies yang berat.</p>
      </div>
    </div>
  );
}
