/* ===== Magnum CPA — 2025 Individual Tax Organizer schema =====
   Shared by the client portal (fill in) and the admin dashboard (review). */
var ORGANIZER_TITLE = '2026 Individual Tax Organizer';
var ORGANIZER_SECTIONS = [
  {title:'Taxpayer Info', fields:[
    {id:'tax_year', label:'Calendar year you are completing this organizer for', type:'select',
     options:['2026 (Jan 1 – Dec 31)','2025 (Jan 1 – Dec 31)','2024 (Jan 1 – Dec 31)','2027 (Jan 1 – Dec 31)']},
    {id:'tp_name', label:'Taxpayer Name', type:'text'},
    {id:'tp_ssn', label:'Social Security Number', type:'text'},
    {id:'tp_dob', label:'Date of Birth', type:'date'},
    {id:'tp_occupation', label:'Occupation', type:'text'},
    {id:'tp_email', label:'Taxpayer Email Address', type:'text'},
    {id:'tp_dl', label:"Upload the front and back of taxpayer's driver's license", type:'file'},
    {id:'tp_ippin', label:'Did you receive an IRS Identity Protection PIN letter to use when filing your return?', type:'yesno'}
  ]},
  {title:'Spouse & Address', fields:[
    {id:'address', label:'Address', type:'textarea'},
    {id:'sp_ssn', label:'Spouse Social Security Number', type:'text'},
    {id:'sp_occupation', label:'Spouse Occupation', type:'text'},
    {id:'sp_email', label:'Spouse Email', type:'text'},
    {id:'sp_phone', label:'Spouse Phone', type:'text'},
    {id:'sp_ippin', label:'Did your spouse receive an IRS Identity Protection PIN letter?', type:'yesno'}
  ]},
  {title:'Dependent Information', fields:[
    {id:'dep_name', label:"Dependent's Name", type:'text'},
    {id:'dep_ssn', label:"Dependent's Social Security Number", type:'text'},
    {id:'dep_dob', label:"Dependent's Date of Birth", type:'date'},
    {id:'dep_rel', label:'What is your relationship to this dependent?', type:'text'},
    {id:'dep_months', label:'How many months did this dependent live with you?', type:'number'},
    {id:'dep_other_claim', label:'Can anyone other than you qualify to claim this dependent?', type:'yesno'},
    {id:'dep_childcare_amt', label:'If you paid for childcare, the amount paid', type:'number'},
    {id:'dep_citizenship', label:"Dependent's citizenship or residency status", type:'text'}
  ]},
  {title:'General Dependent Information', fields:[
    {id:'gdep_rel_docs', label:'If requested by the IRS, what documents could show your relationship to your dependent?', type:'textarea'},
    {id:'gdep_live_docs', label:'If requested by the IRS, do you have documentation the dependent lived with you?', type:'yesno'},
    {id:'gdep_student', label:'Did you claim a child between 19 and 23 who was a full-time student for more than 5 months?', type:'yesno'},
    {id:'gdep_school', label:'What school did they attend?', type:'text'},
    {id:'gdep_childcare_work', label:'Did you pay for childcare so you could work or look for work?', type:'yesno'},
    {id:'gdep_childcare_provider', label:'Who provided childcare while you worked?', type:'text'},
    {id:'gdep_childcare_stmt', label:'Childcare tuition statement', type:'file'},
    {id:'gdep_other_adult', label:'Did any dependents live with another adult relative for more than half the tax year?', type:'yesno'},
    {id:'gdep_other_adult_explain', label:'Please list the adult and explain the living arrangement', type:'textarea'}
  ]},
  {title:'Sources of Income & Uploads', fields:[
    {id:'inc_sources', label:'What were your sources of income for the tax year?', type:'textarea'},
    {id:'inc_nonus', label:'Do you have any non-U.S. income or assets?', type:'yesno'},
    {id:'inc_1099', label:'Upload any 1099s (MISC, INT, R, G, B, C, K, DIV, etc.) you received', type:'file'},
    {id:'inc_w2', label:'Upload any W-2 you received', type:'file'},
    {id:'inc_other', label:'Upload any other income document', type:'file'}
  ]},
  {title:'Rental Income', fields:[
    {id:'rent_addr', label:'Property Address', type:'textarea'},
    {id:'rent_family_stay', label:'Did you or a family member stay at the property last year?', type:'yesno'},
    {id:'rent_improvements', label:'Did you make any improvements to the property last year?', type:'yesno'},
    {id:'rent_purchase_date', label:'Purchase Date', type:'date'},
    {id:'rent_days_rented', label:'Number of days rented', type:'number'},
    {id:'rent_personal_days', label:'Number of personal use days', type:'number'},
    {id:'rent_advertising', label:'Advertising', type:'number'},
    {id:'rent_auto_travel', label:'Auto and Travel Expenses', type:'number'},
    {id:'rent_cleaning', label:'Cleaning and Maintenance', type:'number'},
    {id:'rent_commission', label:'Commission', type:'number'},
    {id:'rent_legal', label:'Legal and Professional Fees', type:'number'},
    {id:'rent_mortgage', label:'Mortgage interest paid to financial institutions', type:'number'},
    {id:'rent_mortgage_doc', label:'Document showing mortgage interest paid', type:'file'},
    {id:'rent_repairs', label:'Repairs and improvements (describe amounts and dates)', type:'textarea'}
  ]},
  {title:'Business Income', fields:[
    {id:'biz_activity', label:'What is the main activity of this business?', type:'text'},
    {id:'biz_ein', label:'EIN / tax registration number', type:'text'},
    {id:'biz_owner', label:'Who owns the business?', type:'text'},
    {id:'biz_1099', label:'Upload any 1099 received for this business', type:'file'},
    {id:'biz_car', label:'Did you use your car for the business last year?', type:'yesno'},
    {id:'biz_vehicle_service_date', label:'When did you place your vehicle in service for business purposes?', type:'date'},
    {id:'biz_other_miles', label:'Number of miles used over the year for other purposes', type:'number'},
    {id:'biz_personal_use', label:'Was your vehicle available for personal use during off-duty hours?', type:'yesno'},
    {id:'biz_other_vehicle', label:'Did you (or your spouse) have another vehicle for personal use?', type:'yesno'},
    {id:'biz_home_office', label:'Is your office based out of your home?', type:'yesno'},
    {id:'biz_home_area', label:'Total area of the house (sq ft)', type:'number'},
    {id:'biz_office_area', label:'Area of business portion (sq ft)', type:'number'}
  ]},
  {title:'Non-US Income', fields:[
    {id:'nonus_10k', label:'Did you have foreign accounts/investments with an aggregate value over $10,000?', type:'yesno'},
    {id:'nonus_50k', label:'A single foreign account over $50,000 on the last day, or over $75,000 at any point in the year?', type:'yesno'}
  ]},
  {title:'Home Sold', fields:[
    {id:'home_addr', label:'Property Address', type:'textarea'},
    {id:'home_purchase_price', label:'Purchase price', type:'number'},
    {id:'home_sale_price', label:'Sale price', type:'number'},
    {id:'home_purchase_date', label:'Date property purchased', type:'date'},
    {id:'home_primary', label:'Was it your main residence for at least 2 of the 5 years prior to the sale?', type:'yesno'},
    {id:'home_1099s', label:'Upload form 1099-S', type:'file'},
    {id:'home_improvements', label:'Improvements to property — list amounts and dates', type:'textarea'},
    {id:'home_fixup', label:'Fixing-up expenses within 90 days of sale — list amounts and dates', type:'textarea'},
    {id:'home_sale_expenses', label:'Expenses related to the sale — list amounts and dates', type:'textarea'}
  ]},
  {title:'Deductions', fields:[
    {id:'ded_fed_est', label:'Did you make federal estimated tax payments last year?', type:'yesno'},
    {id:'ded_state_est', label:'Did you make state estimated tax payments last year?', type:'yesno'},
    {id:'ded_fed_list', label:'List all federal estimated tax payments — amount and dates', type:'textarea'},
    {id:'ded_state_list', label:'List all state estimated tax payments — amount and dates', type:'textarea'}
  ]},
  {title:'Direct Debit', fields:[
    {id:'dd_pay', label:'If tax is owed, pay through direct debit from your bank account?', type:'yesno'},
    {id:'dd_authority', label:'Which tax authority would you like to pay by direct debit?', type:'text'},
    {id:'dd_bank', label:'Bank name', type:'text'},
    {id:'dd_account', label:'Account number', type:'text'},
    {id:'dd_fed_date', label:'Date to pay Federal taxes owed (no later than 4/15)', type:'date'},
    {id:'dd_state_date', label:'Date to pay state (no later than 4/15)', type:'date'}
  ]},
  {title:'Direct Deposit', fields:[
    {id:'dd_refund', label:'If entitled to a refund, would you like to receive it by direct deposit?', type:'yesno'}
  ]}
];

// Pre-fill values pulled from the client's saved profile (used when a field is still blank).
function organizerDefaults(profile, email){
  profile = profile || {};
  return {
    tax_year:       '2026 (Jan 1 – Dec 31)',
    tp_name:        profile.name || '',
    tp_email:       email || '',
    tp_occupation:  profile.job || '',
    tp_dob:         profile.dob || '',
    address:        profile.addr || ''
  };
}
