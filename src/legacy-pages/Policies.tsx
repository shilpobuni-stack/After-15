import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Section = { heading: string; text: string };

function PolicyPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <div className="container shop-page">
      <div className="breadcrumb">
        <Link to="/">হোম</Link>
        <ChevronRight size={13} />
        <span>{title}</span>
      </div>
      <div className="page-heading">
        <div>
          <span className="section-kicker">কুশি শিল্প</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </div>
      <div className="section" style={{ maxWidth: 820, paddingTop: 0 }}>
        {sections.map(({ heading, text }) => (
          <section key={heading} style={{ marginBottom: 30 }}>
            <div className="section-heading"><h2>{heading}</h2></div>
            <p className="muted" style={{ marginTop: 10 }}>{text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <PolicyPage
      title="গোপনীয়তা নীতি"
      intro="আপনার ব্যক্তিগত তথ্যের প্রতি আমাদের যত্ন ও দায়িত্ব।"
      sections={[
        { heading: 'কী তথ্য নেওয়া হয়', text: 'অর্ডার করার সময় আপনার নাম, ফোন নম্বর, ডেলিভারির ঠিকানা এবং অর্ডারের বিবরণ নেওয়া হয়। আপনার ব্যাগ ও পছন্দের তালিকার তথ্য ব্রাউজারেও সংরক্ষিত থাকতে পারে।' },
        { heading: 'তথ্য ব্যবহারের কারণ', text: 'অর্ডার নিশ্চিত করা, পণ্য পৌঁছে দেওয়া এবং অর্ডারসংক্রান্ত প্রয়োজনে যোগাযোগের জন্য এই তথ্য ব্যবহার করা হয়। ডেলিভারির জন্য প্রয়োজনীয় তথ্য সংশ্লিষ্ট ডেলিভারি সেবার সঙ্গে শেয়ার করা হতে পারে।' },
        { heading: 'আপনার যোগাযোগ', text: 'আপনার অর্ডার বা ব্যক্তিগত তথ্য নিয়ে কোনো প্রশ্ন থাকলে দোকানের যোগাযোগ নম্বর বা WhatsApp-এ আমাদের জানান।' },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <PolicyPage
      title="ব্যবহারের শর্তাবলি"
      intro="কুশি শিল্প থেকে কেনাকাটার সাধারণ শর্তগুলো জেনে নিন।"
      sections={[
        { heading: 'পণ্য ও অর্ডার', text: 'ওয়েবসাইটে দেখানো পণ্যের দাম, শেড ও স্টক সময়ে সময়ে পরিবর্তিত হতে পারে। অর্ডার দেওয়ার পর পণ্যের প্রাপ্যতা নিশ্চিত করতে প্রয়োজনে আমরা আপনার সঙ্গে যোগাযোগ করব।' },
        { heading: 'মূল্য ও ডেলিভারি', text: 'চেকআউটে পণ্যের মূল্য, ডেলিভারি চার্জ এবং সর্বমোট টাকা দেখানো হয়। ডেলিভারি এলাকা ও অর্ডারের বিবরণ অনুযায়ী চার্জ নির্ধারিত হয়।' },
        { heading: 'পেমেন্ট ও যোগাযোগ', text: 'ক্যাশ অন ডেলিভারিতে পণ্য হাতে পাওয়ার সময় মূল্য পরিশোধ করা যায়। অন্য পেমেন্ট পদ্ধতি বেছে নিলে চেকআউটে দেওয়া নির্দেশনা অনুসরণ করুন। অর্ডারের তথ্য সঠিকভাবে দেওয়া ক্রেতার দায়িত্ব।' },
      ]}
    />
  );
}

export function ReturnPolicy() {
  return (
    <PolicyPage
      title="ফেরত নীতি"
      intro="পণ্য নিয়ে সমস্যা হলে কী করবেন, তা এখানে জানুন।"
      sections={[
        { heading: 'পণ্য পাওয়ার পর', text: 'ডেলিভারির সময় সম্ভব হলে প্যাকেট ও পণ্যের অবস্থা দেখে নিন। ভুল, ক্ষতিগ্রস্ত বা ত্রুটিযুক্ত পণ্য পেলে যত দ্রুত সম্ভব অর্ডার নম্বর ও সমস্যার বিবরণসহ আমাদের জানান।' },
        { heading: 'ফেরত বা পরিবর্তনের অনুরোধ', text: 'পণ্য ব্যবহার না করে মূল অবস্থায় রাখুন এবং সমস্যা বোঝাতে ছবি দিন। পণ্যের অবস্থা ও অর্ডারের তথ্য যাচাই করে ফেরত, পরিবর্তন বা অন্য সমাধান সম্পর্কে আপনাকে জানানো হবে।' },
        { heading: 'সহায়তা', text: 'ফেরত বা পরিবর্তন নিয়ে প্রশ্ন থাকলে অর্ডার আইডিসহ দোকানের যোগাযোগ নম্বর বা WhatsApp-এ যোগাযোগ করুন।' },
      ]}
    />
  );
}
