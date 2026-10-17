// =====================================================================
//  Built-in list of lenders in India, shown in the Client dropdown.
//  Grouped the way RBI classifies them, plus the housing-finance
//  companies and NBFCs that give home and vehicle loans.
//  Anything missing can be added from the dropdown ("+ नया Client जोड़ें");
//  it is then saved in the Clients sheet and shown at the top.
// =====================================================================
export const BANK_GROUPS = [
  {
    label: 'Public Sector Banks',
    items: [
      'State Bank of India', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India',
      'Bank of India', 'Indian Bank', 'Central Bank of India', 'Indian Overseas Bank', 'UCO Bank',
      'Bank of Maharashtra', 'Punjab & Sind Bank',
    ],
  },
  {
    label: 'Private Sector Banks',
    items: [
      'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank', 'YES Bank', 'IDFC FIRST Bank',
      'IDBI Bank', 'Federal Bank', 'Bandhan Bank', 'RBL Bank', 'South Indian Bank', 'Karur Vysya Bank',
      'Karnataka Bank', 'City Union Bank', 'Tamilnad Mercantile Bank', 'DCB Bank', 'CSB Bank', 'Dhanlaxmi Bank',
      'Jammu & Kashmir Bank', 'Nainital Bank',
    ],
  },
  {
    label: 'Small Finance Banks',
    items: [
      'AU Small Finance Bank', 'Equitas Small Finance Bank', 'Ujjivan Small Finance Bank', 'Jana Small Finance Bank',
      'Utkarsh Small Finance Bank', 'Suryoday Small Finance Bank', 'ESAF Small Finance Bank', 'Capital Small Finance Bank',
      'North East Small Finance Bank', 'Shivalik Small Finance Bank', 'Unity Small Finance Bank',
    ],
  },
  {
    label: 'Regional Rural & Co-operative Banks',
    items: [
      'Chhattisgarh Rajya Gramin Bank', 'Chhattisgarh Rajya Sahakari Bank (Apex Bank)',
      'Raipur Zila Sahakari Kendriya Bank', 'Madhya Pradesh Gramin Bank', 'Maharashtra Gramin Bank',
      'Odisha Gramya Bank', 'Baroda UP Bank', 'Aryavart Bank', 'Saraswat Co-operative Bank',
      'Cosmos Co-operative Bank', 'SVC Co-operative Bank',
    ],
  },
  {
    label: 'Foreign Banks',
    items: ['Standard Chartered Bank', 'HSBC', 'DBS Bank India', 'Deutsche Bank', 'Citibank'],
  },
  {
    label: 'Housing Finance Companies',
    items: [
      'LIC Housing Finance', 'Bajaj Housing Finance', 'PNB Housing Finance', 'Tata Capital Housing Finance',
      'Aadhar Housing Finance', 'Aavas Financiers', 'Home First Finance', 'IIFL Home Finance', 'Can Fin Homes',
      'Piramal Capital & Housing Finance', 'ICICI Home Finance', 'Aditya Birla Housing Finance', 'Godrej Housing Finance',
      'Sammaan Capital (Indiabulls Housing)', 'Repco Home Finance', 'GIC Housing Finance', 'India Shelter Finance',
      'Shubham Housing Development Finance', 'Hinduja Housing Finance', 'Sundaram Home Finance', 'Muthoot Housing Finance',
      'Shriram Housing Finance', 'L&T Housing Finance', 'Vastu Housing Finance', 'Aptus Value Housing Finance',
    ],
  },
  {
    label: 'NBFCs (Vehicle / Personal / Business Loans)',
    items: [
      'Bajaj Finance', 'Tata Capital', 'Mahindra & Mahindra Financial Services', 'Shriram Finance',
      'Cholamandalam Investment and Finance', 'Sundaram Finance', 'L&T Finance', 'Hero FinCorp', 'Poonawalla Fincorp',
      'Aditya Birla Capital', 'Kotak Mahindra Prime', 'TVS Credit Services', 'Toyota Financial Services India',
      'Hinduja Leyland Finance', 'Muthoot Finance', 'Manappuram Finance', 'IIFL Finance', 'Five Star Business Finance',
      'SK Finance', 'Fullerton India (SMFG India Credit)', 'HDB Financial Services', 'Mahindra Rural Housing Finance',
    ],
  },
];

export const ALL_BANKS = BANK_GROUPS.flatMap((g) => g.items);
