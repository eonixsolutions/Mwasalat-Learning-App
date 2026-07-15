// Heuristic "AI" category/description suggester — no external AI API key is
// available, so this matches keywords in the course title against Mwasalat's
// actual training taxonomy (driver ops, HSE, compliance, HR, etc.) instead.
// Suggestions are always editable by the instructor before saving.

const CATEGORY = {
  DRIVER_OPS: 'Driver & Operations Training',
  HSC: 'Health, Safety & Compliance',
  CUSTOMER: 'Customer Service',
  GOVERNANCE: 'Compliance & Governance',
  TECHNICAL: 'Technical & Maintenance Staff Training',
  IT: 'IT & Digital Skills',
  LEADERSHIP: 'Leadership & Soft Skills',
  HR: 'HR & Onboarding',
  CERTIFICATION: 'Specialized & Regulatory Certifications',
  EMERGENCY: 'Emergency & Crisis Management',
};

// Ordered most-specific-first: narrow multi-word phrases are checked before
// broad single-word catch-alls, so e.g. "defensive driving" resolves to
// Driver & Operations Training rather than the generic Health & Safety bucket.
const KEYWORD_RULES = [
  // 1. Driver & Operations Training
  { keywords: ['defensive driv', 'defensive'], category: CATEGORY.DRIVER_OPS, subCategory: 'Defensive Driving / Road Safety' },
  { keywords: ['pre-trip', 'pre trip', 'vehicle inspect'], category: CATEGORY.DRIVER_OPS, subCategory: 'Vehicle Inspection & Pre-Trip Checks' },
  { keywords: ['bus maintenance', 'vehicle maintenance basic'], category: CATEGORY.DRIVER_OPS, subCategory: 'Bus/Vehicle Maintenance Basics' },
  { keywords: ['fuel efficien', 'eco driv', 'fuel saving'], category: CATEGORY.DRIVER_OPS, subCategory: 'Fuel Efficiency Driving Techniques' },
  { keywords: ['boarding', 'passenger handling'], category: CATEGORY.DRIVER_OPS, subCategory: 'Passenger Handling & Boarding Safety' },
  { keywords: ['route and schedule', 'schedule adherence', 'route adherence'], category: CATEGORY.DRIVER_OPS, subCategory: 'Route & Schedule Adherence' },
  { keywords: ['incident report', 'accident report'], category: CATEGORY.DRIVER_OPS, subCategory: 'Accident/Incident Reporting Procedures' },
  { keywords: ['fatigue'], category: CATEGORY.DRIVER_OPS, subCategory: 'Fatigue Management for Drivers' },

  // 2. Health, Safety & Compliance
  { keywords: ['occupational health', ' ohs', 'ohs '], category: CATEGORY.HSC, subCategory: 'Occupational Health & Safety (OHS)' },
  { keywords: ['fire safety', 'fire evacuat'], category: CATEGORY.HSC, subCategory: 'Fire Safety & Evacuation' },
  { keywords: ['first aid', 'cpr', 'emergency response'], category: CATEGORY.HSC, subCategory: 'First Aid & Emergency Response' },
  { keywords: ['hazard', 'risk assess'], category: CATEGORY.HSC, subCategory: 'Hazard Identification & Risk Assessment' },
  { keywords: ['ppe', 'protective equipment'], category: CATEGORY.HSC, subCategory: 'PPE Usage' },
  { keywords: ['environmental compliance', 'environment'], category: CATEGORY.HSC, subCategory: 'Environmental Compliance' },
  { keywords: ['traffic law', 'traffic regulat', 'oman traffic'], category: CATEGORY.HSC, subCategory: 'Traffic Law & Regulatory Updates (Oman)' },

  // 3. Customer Service
  { keywords: ['passenger service', 'service standard'], category: CATEGORY.CUSTOMER, subCategory: 'Passenger Service Standards' },
  { keywords: ['complaint'], category: CATEGORY.CUSTOMER, subCategory: 'Complaint Handling' },
  { keywords: ['communication skill', 'arabic', 'bilingual'], category: CATEGORY.CUSTOMER, subCategory: 'Communication Skills (Arabic + English)' },
  { keywords: ['special needs', 'disab', 'accessib'], category: CATEGORY.CUSTOMER, subCategory: 'Handling Passengers with Special Needs' },
  { keywords: ['de-escalat', 'de escalat', 'conflict'], category: CATEGORY.CUSTOMER, subCategory: 'Conflict De-escalation' },

  // 4. Compliance & Governance
  { keywords: ['anti-corruption', 'anti corruption', 'code of conduct'], category: CATEGORY.GOVERNANCE, subCategory: 'Anti-Corruption / Code of Conduct' },
  { keywords: ['data protection', 'confidential'], category: CATEGORY.GOVERNANCE, subCategory: 'Data Protection & Confidentiality' },
  { keywords: ['anti-harassment', 'anti harassment', 'workplace conduct'], category: CATEGORY.GOVERNANCE, subCategory: 'Anti-Harassment & Workplace Conduct' },
  { keywords: ['iso'], category: CATEGORY.GOVERNANCE, subCategory: 'ISO Certification-Related Training' },
  { keywords: ['internal audit', 'audit awareness'], category: CATEGORY.GOVERNANCE, subCategory: 'Internal Audit Awareness' },

  // 5. Technical & Maintenance Staff Training
  { keywords: ['mechanical system', 'mechanic'], category: CATEGORY.TECHNICAL, subCategory: 'Vehicle Mechanical Systems' },
  { keywords: ['electrical', 'electronic system'], category: CATEGORY.TECHNICAL, subCategory: 'Electrical/Electronic Systems in Buses' },
  { keywords: ['workshop safety'], category: CATEGORY.TECHNICAL, subCategory: 'Workshop Safety Procedures' },
  { keywords: ['spare part', 'inventory'], category: CATEGORY.TECHNICAL, subCategory: 'Spare Parts & Inventory Management' },

  // 6. IT & Digital Skills
  { keywords: ['ms office', 'microsoft office', 'digital literacy', 'excel', 'word', 'powerpoint'], category: CATEGORY.IT, subCategory: 'MS Office / Digital Literacy' },
  { keywords: ['cybersecurity', 'cyber security', 'phishing'], category: CATEGORY.IT, subCategory: 'Cybersecurity Awareness' },
  { keywords: ['ticketing system', 'hrms', 'new system', 'onboarding system', 'lms'], category: CATEGORY.IT, subCategory: 'New Systems Onboarding' },

  // 7. Leadership & Soft Skills
  { keywords: ['supervisory', 'supervisor', 'management training'], category: CATEGORY.LEADERSHIP, subCategory: 'Supervisory/Management Training' },
  { keywords: ['team leadership', 'leadership'], category: CATEGORY.LEADERSHIP, subCategory: 'Team Leadership' },
  { keywords: ['time management'], category: CATEGORY.LEADERSHIP, subCategory: 'Time Management' },
  { keywords: ['performance management', 'performance review'], category: CATEGORY.LEADERSHIP, subCategory: 'Performance Management for Managers' },

  // 8. HR & Onboarding
  { keywords: ['induction', 'orientation', 'new employee'], category: CATEGORY.HR, subCategory: 'New Employee Induction/Orientation' },
  { keywords: ['hr polic', 'hr procedure'], category: CATEGORY.HR, subCategory: 'HR Policies & Procedures' },
  { keywords: ['payroll', 'benefits orientation', 'compensation'], category: CATEGORY.HR, subCategory: 'Benefits & Payroll Orientation' },

  // 9. Specialized/Regulatory Certifications
  { keywords: ['licens', 'operator licens'], category: CATEGORY.CERTIFICATION, subCategory: 'Public Transport Operator Licensing Renewal' },
  { keywords: ['cpd', 'continuing professional'], category: CATEGORY.CERTIFICATION, subCategory: 'CPD Tracked Courses' },
  { keywords: ['regulator', 'public authority for land transport', 'palt'], category: CATEGORY.CERTIFICATION, subCategory: 'External Regulator-Mandated Training' },

  // 10. Emergency & Crisis Management
  { keywords: ['business continuity'], category: CATEGORY.EMERGENCY, subCategory: 'Business Continuity Training' },
  { keywords: ['crisis communication'], category: CATEGORY.EMERGENCY, subCategory: 'Crisis Communication' },
  { keywords: ['evacuation drill', 'emergency drill'], category: CATEGORY.EMERGENCY, subCategory: 'Emergency Evacuation Drills' },

  // Broad catch-alls — only reached if nothing more specific matched above.
  { keywords: ['driv', 'road', 'traffic'], category: CATEGORY.DRIVER_OPS, subCategory: 'Defensive Driving / Road Safety' },
  { keywords: ['evacuat', 'emergency'], category: CATEGORY.HSC, subCategory: 'Fire Safety & Evacuation' },
  { keywords: ['vehicle', 'maintenance', 'inspect'], category: CATEGORY.TECHNICAL, subCategory: 'Vehicle Mechanical Systems' },
  { keywords: ['customer', 'service', 'hospitality'], category: CATEGORY.CUSTOMER, subCategory: 'Passenger Service Standards' },
  { keywords: ['health', 'safety', 'compliance', 'hazard'], category: CATEGORY.HSC, subCategory: 'Occupational Health & Safety (OHS)' },
  { keywords: ['harassment', 'corruption', 'governance'], category: CATEGORY.GOVERNANCE, subCategory: 'Anti-Harassment & Workplace Conduct' },
];

const DEFAULT_SUGGESTION = { category: 'Professional Development', subCategory: 'General Training' };

export const suggestFromTitle = (title) => {
  const lower = title.toLowerCase();
  const match = KEYWORD_RULES.find((rule) => rule.keywords.some((kw) => lower.includes(kw)));
  const { category, subCategory } = match ?? DEFAULT_SUGGESTION;

  const description = `This course on "${title}" builds practical, job-ready skills in ${subCategory.toLowerCase()}, following Mwasalat's standardised training approach for ${category.toLowerCase()}.`;

  return { category, subCategory, description };
};
