// Learn pages. Written in plain words from official guidance. Sources are listed on each page.
// Body HTML is trusted app content, not user input.
export const PAGES = [
  {
    slug: 'who-issues-permits',
    title: 'Who gives the permit? Land type decides',
    blurb: 'State, county, federal, or private. The owner of the land sets the rules.',
    body: `
<p>Hawaiʻi has no single permit for the outdoors. The agency that manages the land issues the permit. Once you know who manages a place, you know where to look.</p>
<h2>State land</h2>
<p>The Department of Land and Natural Resources (DLNR) manages most public wild land. Three divisions matter most.</p>
<ul>
<li><strong>Division of State Parks</strong> runs state parks, recreation areas, and waysides. Camping and cabins are booked at explore.ehawaii.gov. Nonresident entry and parking reservations for busy parks like Diamond Head, ʻĪao, Waiʻānapanapa, and Hāʻena are at gostateparks.hawaii.gov.</li>
<li><strong>Division of Forestry and Wildlife</strong> runs forest reserves, natural area reserves, Nā Ala Hele trails, hunting, and forest reserve camping (camping.ehawaii.gov). Hunting licenses come from here too.</li>
<li><strong>Division of Aquatic Resources</strong> sets fishing rules and issues fishing licenses.</li>
</ul>
<h2>County land</h2>
<p>Each county runs its own beach parks and campgrounds with its own permit system. Honolulu uses pros.hnl.info. Kauaʻi, Maui, and Hawaiʻi counties each have their own site or permit office. County permits never cover state parks, and state permits never cover county parks.</p>
<h2>Federal land</h2>
<p>The National Park Service runs Haleakalā, Hawaiʻi Volcanoes, Kalaupapa, and the historical parks on Hawaiʻi Island. Campgrounds, cabins, and the Haleakalā sunrise reservation are on recreation.gov. Backcountry permits come from each park. The U.S. Fish and Wildlife Service runs national wildlife refuges, most of which have limited or no public access.</p>
<h2>Private, nonprofit, and trust land</h2>
<p>Ranches, churches, camps, and trusts such as Kamehameha Schools own large areas. Some run campgrounds or cabins that anyone can book straight from the owner. Others allow no access at all, and entering is trespassing. When a trail crosses private land, the state may have an access agreement with rules like day use only or a permit. Ala lists what we could confirm from the owner.</p>
<h2>Military land</h2>
<p>Military bases and training areas are closed to the public unless you have base access. Some, like Bellows, have campgrounds only for military families.</p>
<p>Ala is not an official government app. Always confirm with the agency or owner before you go.</p>`,
    sources: ['https://dlnr.hawaii.gov/dsp/', 'https://dlnr.hawaii.gov/dofaw/permits/', 'https://outdoor.hawaii.gov/camping/', 'https://www.nps.gov/state/hi/index.htm', 'https://www.honolulu.gov/dpr/wp-content/uploads/sites/34/2024/04/Honolulu_Parks_and_Recreation_Family_Camping_FAQs-1.pdf'],
  },
  {
    slug: 'fishing-licenses',
    title: 'Fishing: what license do I need?',
    blurb: 'Freshwater needs a license. Ocean fishing needs one only for visitors. Rules are by species and place.',
    body: `
<h2>Freshwater</h2>
<p>You need a freshwater game fishing license to take introduced game fish like bass, tilapia, catfish, and trout in streams and reservoirs. Buy it online at freshwater.ehawaii.gov or at a DAR office. Residents and military 16 and over pay $5 a year. Minors 9 to 15 pay $3. Seniors 65 and over fish free. Visitors can buy a 7 day license for $10, a 30 day license for $20, or a year for $25.</p>
<h2>Ocean</h2>
<p>Hawaiʻi residents do not need a license for recreational ocean fishing from shore or a boat.</p>
<p>Since 2024, anyone 15 or older who is not a Hawaiʻi resident needs a nonresident recreational marine fishing license to fish, spear, or gather in the ocean. It costs $20 for one day, $40 for seven days, or $70 for a year, plus a processing fee, at fishing.hawaii.gov. Active duty military and their minor children are exempt. This is state law (HRS 188-72).</p>
<h2>Rules are by species and place</h2>
<p>There is no single set of ocean rules. Size limits, bag limits, closed seasons, and gear rules are set for each species. Some areas are marine life conservation districts or fisheries management areas with their own rules, and some are closed to all fishing. Before you fish, check the Division of Aquatic Resources fishing regulations for the species and the exact spot. Ala lists a few protected areas but not every rule.</p>
<h2>Gathering</h2>
<p>Taking ʻopihi, limu, crab, or other sea life counts as fishing and follows the same rules. Some species are protected all year.</p>`,
    sources: ['https://dlnr.hawaii.gov/dar/licenses-and-permits/freshwater-game-fishing-license/', 'https://dlnr.hawaii.gov/dar/licenses-and-permits/nonresident-recreational-marine-fishing-license/', 'https://law.justia.com/codes/hawaii/title-12/chapter-188/section-188-72/', 'https://dlnr.hawaii.gov/dar/fishing/'],
  },
  {
    slug: 'hunting-basics',
    title: 'Hunting: license, hunter education, and units',
    blurb: 'Hunter education first, then a license, then check the unit rules.',
    body: `
<h2>Step 1: hunter education</h2>
<p>Everyone 10 and older must finish a hunter education course before a first Hawaiʻi license. The Hawaiʻi course has an online part and an in person field day. Hunters who finished a course in another state can ask for a letter of exemption instead. Details are at outdoor.hawaii.gov/hunting/certification.</p>
<h2>Step 2: license</h2>
<p>A Hawaiʻi hunting license costs $10 for residents and $95 for nonresidents. It includes the wildlife conservation stamp and runs from the day you buy it to June 30. To hunt game birds you also need a $10 game bird stamp. Buy at hunting.ehawaii.gov. All sales are final.</p>
<h2>Step 3: the unit</h2>
<p>Public hunting happens in hunting units on state land, and some private land with agreements. Each island has lettered or numbered units with their own seasons, bag limits, days, and weapons rules. Some hunts need a separate hunt permit or lottery tag. Check the island hunting page at dlnr.hawaii.gov/recreation/hunting before each trip.</p>
<h2>Safety for everyone</h2>
<ul>
<li>Hikers in hunting areas: wear bright colors, stay on the trail, and keep dogs leashed.</li>
<li>Hunters: know the safety zones, never shoot across a trail or road, and carry your license.</li>
<li>Check in at hunter check stations where they exist.</li>
</ul>`,
    sources: ['https://outdoor.hawaii.gov/hunting/licensing/', 'https://outdoor.hawaii.gov/hunting/certification/', 'https://dlnr.hawaii.gov/recreation/hunting/'],
  },
];
