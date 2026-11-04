// ঢাকা সিটি (উত্তর ও দক্ষিণ সিটি কর্পোরেশন) এলাকার বাইরের জায়গার নাম।
// ঠিকানায় এগুলোর কোনোটা থাকলে ডেলিভারি "ঢাকা সিটির বাইরে" ধরা হয়।
// কোনো নাম ঢাকা সিটির ভিতরে ধরতে চাইলে তালিকা থেকে মুছে দিন, নতুন নাম যোগ করতে চাইলে কমা দিয়ে লিখুন।

// ঢাকা জেলার সিটির বাইরের থানা/উপজেলা ও আশপাশের এলাকা
const OUTSIDE_BN = [
  'সাভার', 'আশুলিয়া', 'ধামরাই', 'কেরানীগঞ্জ', 'কেরানিগঞ্জ', 'নবাবগঞ্জ', 'দোহার', 'আমিনবাজার', 'হেমায়েতপুর', 'বাইপাইল',
  'টঙ্গী', 'জয়দেবপুর', 'কালিয়াকৈর', 'কাপাসিয়া', 'চন্দ্রা', 'সিদ্ধিরগঞ্জ', 'ফতুল্লা', 'রূপগঞ্জ', 'সোনারগাঁও', 'কাঁচপুর', 'আড়াইহাজার',
  // ঢাকা ছাড়া বাকি ৬৩ জেলা (বানানের কয়েকটা রূপসহ)
  'গাজীপুর', 'গোপালগঞ্জ', 'কিশোরগঞ্জ', 'মাদারীপুর', 'মাদারিপুর', 'মানিকগঞ্জ', 'মুন্সীগঞ্জ', 'মুন্সিগঞ্জ', 'নারায়ণগঞ্জ', 'নরসিংদী', 'নরসিংদি',
  'রাজবাড়ী', 'রাজবাড়ি', 'শরীয়তপুর', 'শরিয়তপুর', 'টাঙ্গাইল', 'ফরিদপুর',
  'জামালপুর', 'ময়মনসিংহ', 'ময়মনসিং', 'নেত্রকোণা', 'নেত্রকোনা', 'শেরপুর',
  'বান্দরবান', 'বান্দরবন', 'ব্রাহ্মণবাড়িয়া', 'ব্রাহ্মণবাড়ীয়া', 'চাঁদপুর', 'চাদপুর', 'চট্টগ্রাম', 'চিটাগাং', 'চিটাগং', 'কুমিল্লা', 'কুমিলা',
  'কক্সবাজার', 'কক্স বাজার', 'ফেনী', 'খাগড়াছড়ি', 'খাগড়াছড়ী', 'লক্ষ্মীপুর', 'লক্ষীপুর', 'নোয়াখালী', 'নোয়াখালি', 'রাঙামাটি', 'রাঙ্গামাটি',
  'বগুড়া', 'জয়পুরহাট', 'নওগাঁ', 'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'চাঁপাই নবাবগঞ্জ', 'পাবনা', 'রাজশাহী', 'সিরাজগঞ্জ',
  'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'লালমনিরহাট', 'লালমনির হাট', 'নীলফামারী', 'নীলফামারি', 'পঞ্চগড়', 'রংপুর', 'ঠাকুরগাঁও', 'ঠাকুরগাঁ',
  'বাগেরহাট', 'চুয়াডাঙ্গা', 'যশোর', 'যশোহর', 'ঝিনাইদহ', 'খুলনা', 'কুষ্টিয়া', 'মাগুরা', 'মেহেরপুর', 'নড়াইল', 'সাতক্ষীরা', 'সাতক্ষিরা',
  'বরগুনা', 'বরিশাল', 'ঝালকাঠি', 'ঝালকাঠী', 'পটুয়াখালী', 'পটুয়াখালি', 'পিরোজপুর',
  'হবিগঞ্জ', 'মৌলভীবাজার', 'মৌলবীবাজার', 'সুনামগঞ্জ', 'সিলেট',
];
// এই নামগুলো সাধারণ শব্দ বা নামের অংশ হতে পারে, তাই আলাদা নিয়মে যাচাই হয়
const OUTSIDE_STRICT_BN = ['ভোলা'];
const OUTSIDE_EN = [
  'savar', 'ashulia', 'dhamrai', 'keraniganj', 'nawabganj', 'dohar', 'aminbazar', 'hemayetpur', 'baipail',
  'tongi', 'joydebpur', 'kaliakair', 'kapasia', 'siddhirganj', 'fatullah', 'rupganj', 'sonargaon', 'kanchpur',
  'gazipur', 'gopalganj', 'kishoreganj', 'madaripur', 'manikganj', 'munshiganj', 'narayanganj', 'narsingdi', 'narshingdi',
  'rajbari', 'shariatpur', 'tangail', 'faridpur',
  'jamalpur', 'mymensingh', 'netrokona', 'netrakona', 'sherpur',
  'bandarban', 'brahmanbaria', 'chandpur', 'chattogram', 'chattagram', 'chittagong', 'cumilla', 'comilla',
  "cox's bazar", 'coxs bazar', 'cox bazar', 'coxbazar', 'feni', 'khagrachari', 'khagrachhari', 'lakshmipur', 'laxmipur', 'noakhali', 'rangamati',
  'bogura', 'bogra', 'joypurhat', 'jaipurhat', 'naogaon', 'natore', 'chapainawabganj', 'chapai nawabganj', 'pabna', 'rajshahi', 'sirajganj',
  'dinajpur', 'gaibandha', 'kurigram', 'lalmonirhat', 'nilphamari', 'panchagarh', 'rangpur', 'thakurgaon',
  'bagerhat', 'chuadanga', 'jashore', 'jessore', 'jhenaidah', 'khulna', 'kushtia', 'magura', 'meherpur', 'narail', 'satkhira',
  'barguna', 'barishal', 'barisal', 'bhola', 'jhalokati', 'jhalakathi', 'patuakhali', 'pirojpur',
  'habiganj', 'moulvibazar', 'maulvibazar', 'sunamganj', 'sylhet',
];
// "ময়মনসিংহ রোড"-এর মতো ঢাকার রাস্তার নাম যেন ভুল ধরা না হয়
const ROAD_AFTER = /^(হ|ও)?[\s,.-]*(রোড|সড়ক|রাস্তা|লেন|হাইওয়ে|road|rd\b|highway|lane|sarak)/i;
const BN_CHAR = /[\u0980-\u09FF]/;
// "ভোলায়", "ভোলার" ইত্যাদির মতো বিভক্তি চলবে
const BN_SUFFIX = /^(র|য়|\u09DF|\u09AF\u09BC|তে|ে|ের|ও)/;

function found(text, words, mode) {
  for (const word of words) {
    let from = 0;
    for (;;) {
      const at = text.indexOf(word, from);
      if (at === -1) break;
      from = at + word.length;
      const before = text[at - 1] || ' ';
      const after = text[at + word.length] || ' ';
      if (mode === 'en' && (/[a-z]/.test(before) || /[a-z]/.test(after))) continue;
      if (mode === 'strict') {
        if (BN_CHAR.test(before)) continue;
        if (BN_CHAR.test(after) && !BN_SUFFIX.test(text.slice(at + word.length, at + word.length + 3))) continue;
      }
      if (ROAD_AFTER.test(text.slice(from, from + 14))) continue;
      return true;
    }
  }
  return false;
}

export function isOutsideDhakaCity(address) {
  const text = String(address || '').toLowerCase();
  if (!text.trim()) return false;
  return found(text, OUTSIDE_BN, 'bn') || found(text, OUTSIDE_STRICT_BN, 'strict') || found(text, OUTSIDE_EN, 'en');
  }
