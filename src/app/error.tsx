'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container not-found" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h1>কিছু একটা সমস্যা হয়েছে</h1>
      <p style={{ margin: '12px 0 22px' }}>দয়া করে আবার চেষ্টা করুন।</p>
      <button className="button primary" onClick={reset}>আবার চেষ্টা করুন</button>
    </main>
  );
      }
