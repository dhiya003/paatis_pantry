export type Dish = {
  id: string;
  name: string;
  tamil: string;
  ingredients: string[];
  steps: string[];
  safety: string;
  nutrition: string[];
};

export const dishes: Dish[] = [
  { id:"idli", name:"Fresh soft idli & coconut chutney", tamil:"மென்மையான இட்லி", ingredients:["1 freshly steamed small idli","2 tsp fresh coconut","1 tsp roasted gram","3 tbsp boiled warm water","¼ tsp ghee"], steps:["Use fresh, non-sour batter and steam until completely set.","Grind coconut and roasted gram smooth with boiled water; no chilli or salt.","Crumble, moisten fully with chutney and ghee, then serve immediately."], safety:"Make only enough batter to ferment and cook once. Do not keep leftover batter or chutney without refrigeration.", nutrition:["Grain","Pulse protein","Healthy fat"] },
  { id:"appam", name:"Appam & vegetable-moong stew", tamil:"ஆப்பம்", ingredients:["½ soft appam","2 tbsp carrot + chow chow","1 tbsp cooked moong dal","2 tbsp fresh thin coconut milk","¼ tsp ghee"], steps:["Steam vegetables and dal until finger-soft.","Mash and simmer with fresh coconut milk for 2 minutes.","Soak tiny pieces of the soft appam centre and serve fresh."], safety:"Do not serve crisp edges. Discard coconut milk and stew after 2 hours, or 1 hour above 32°C.", nutrition:["Grain","Protein","Vegetable"] },
  { id:"neer", name:"Neer dosai & tomato-carrot chutney", tamil:"நீர் தோசை", ingredients:["½ soft neer dosai","2 tbsp tomato","2 tbsp carrot","1 tsp roasted gram","¼ tsp ghee"], steps:["Steam tomato and carrot.","Blend smooth with roasted gram and cook for 2 minutes.","Tear dosai finely and coat completely."], safety:"No chilli, whole mustard or curry-leaf pieces. Use batter immediately.", nutrition:["Grain","Protein","Vegetable"] },
  { id:"idiyappam", name:"Idiyappam & moong coconut milk", tamil:"இடியாப்பம்", ingredients:["½ small idiyappam","1 tbsp cooked moong dal","2 tbsp fresh thin coconut milk","¼ tsp ghee"], steps:["Mash dal completely smooth.","Warm with coconut milk without boiling hard.","Cut strands short, soak and mash."], safety:"Long strands can be difficult to manage; cut before serving.", nutrition:["Grain","Protein","Healthy fat"] },
  { id:"pongal", name:"Vegetable ven pongal", tamil:"காய்கறி வெண் பொங்கல்", ingredients:["2 tbsp rice","1 tbsp moong dal","2 tbsp pumpkin","¾ cup water","½ tsp ghee"], steps:["Cook rice, dal and pumpkin until collapsing-soft.","Mash with boiled water to thick porridge.","Add ghee and a pinch of cumin powder."], safety:"No whole pepper, cashew or ginger pieces.", nutrition:["Grain","Protein","Vegetable"] },
  { id:"ragi", name:"Ragi, moong & pear porridge", tamil:"கேழ்வரகு கஞ்சி", ingredients:["1 tbsp ragi flour","1 tsp moong powder","¾ cup water","2 tbsp steamed pear","¼ tsp ghee"], steps:["Make a lump-free slurry with cool water.","Cook 8–10 minutes until glossy and fully cooked.","Mix in steamed pear and ghee."], safety:"No jaggery, sugar or honey. Never add uncooked dal powder after cooking.", nutrition:["Iron","Protein","Fruit"] },
  { id:"thinai", name:"Thinai vegetable pongal", tamil:"தினை பொங்கல்", ingredients:["2 tbsp thinai","1 tbsp moong dal","2 tbsp bottle gourd","1 cup water","½ tsp ghee"], steps:["Inspect, rinse and soak thinai for 2 hours.","Cook until grains lose their shape.","Mash well and add ghee."], safety:"Offer a small amount first if this millet is new.", nutrition:["Millet","Protein","Vegetable"] },
  { id:"kuthiraivali", name:"Kuthiraivali khichdi", tamil:"குதிரைவாலி கிச்சடி", ingredients:["2 tbsp kuthiraivali","1 tbsp moong dal","2 tbsp pumpkin","1 cup water","½ tsp ghee"], steps:["Check for stones, rinse and soak 2 hours.","Cook until grain and dal collapse.","Mash into a soft cohesive texture."], safety:"Millets need careful washing and thorough cooking.", nutrition:["Millet","Protein","Vegetable"] },
  { id:"matta", name:"Matta rice, dal & pumpkin mash", tamil:"மட்ட அரிசி பருப்பு சாதம்", ingredients:["2 tbsp matta rice","1 tbsp moong dal","2 tbsp pumpkin","1¼ cups water","½ tsp ghee"], steps:["Soak matta rice for 4 hours.","Cook rice, dal and pumpkin completely soft.","Mash, thin if needed and add ghee."], safety:"Matta rice stays firm; never serve it al dente.", nutrition:["Whole grain","Protein","Vegetable"] },
  { id:"samba", name:"Mappillai Samba keerai rice", tamil:"மாப்பிள்ளை சம்பா கீரை சாதம்", ingredients:["2 tbsp Mappillai Samba","1 tbsp moong dal","2 tbsp arai keerai","1¼ cups water","½ tsp ghee"], steps:["Soak rice 4–6 hours and wash greens carefully.","Cook rice and dal very soft; steam greens.","Combine, mash and finish with ghee."], safety:"Use one familiar green rather than mixing several.", nutrition:["Whole grain","Protein","Greens"] },
  { id:"kavuni", name:"Karuppu Kavuni moong kanji", tamil:"கருப்பு கவுனி கஞ்சி", ingredients:["1 tbsp Karuppu Kavuni","1 tbsp moong dal","1¼ cups water","½ tsp ghee"], steps:["Rinse and soak 4–6 hours, then cook immediately.","Cook with extra water until collapsing-soft.","Mash thoroughly, thin and add ghee."], safety:"Offer occasionally and never serve firm grains.", nutrition:["Whole grain","Protein","Fibre"] },
  { id:"handrice", name:"Hand-pounded vegetable paruppu sadam", tamil:"கைக்குத்தல் அரிசி பருப்பு சாதம்", ingredients:["2 tbsp hand-pounded rice","1 tbsp toor dal","3 tbsp mixed vegetables","1¼ cups water","½ tsp ghee"], steps:["Cook rice, dal and vegetables together.","Mash thoroughly and thin if needed.","Remove baby portion before family seasoning."], safety:"No chilli, stock cubes, strong tamarind or added salt.", nutrition:["Whole grain","Protein","Vegetables"] },
  { id:"egg", name:"Well-cooked egg vegetable rice", tamil:"முட்டை காய்கறி சாதம்", ingredients:["1 fully cooked egg","2 tbsp soft rice","2 tbsp carrot or pumpkin","3 tbsp warm water","¼ tsp ghee"], steps:["Cook white and yolk fully.","Mash with rice and soft vegetable.","Add water and ghee for a moist texture."], safety:"Only after egg has been introduced safely. Otherwise replace with 1 tbsp moong dal.", nutrition:["Grain","Egg protein","Vegetable"] },
  { id:"curd", name:"Soft curd rice & cucumber", tamil:"தயிர் சாதம்", ingredients:["3 tbsp overcooked rice","2 tbsp newly purchased pasteurised curd","1 tbsp steamed cucumber","2 tbsp boiled water"], steps:["Mash rice smooth and cool.","Open curd only at serving time and combine.","Serve immediately."], safety:"Without a refrigerator, buy a small sealed cup just before serving and discard the remainder.", nutrition:["Grain","Dairy","Vegetable"] },
  { id:"fruit", name:"Banana-papaya mash", tamil:"பழ மசியல்", ingredients:["2 tbsp ripe banana","2 tbsp ripe papaya"], steps:["Wash hands and fruit exterior.","Mash just before serving.","Keep softly lumpy only if safely managed."], safety:"No milk, sugar or honey. Do not store cut fruit.", nutrition:["Fruit","Vitamin C","Fibre"] },
  { id:"apple", name:"Steamed apple & sweet potato", tamil:"ஆப்பிள் சர்க்கரைவள்ளி", ingredients:["2 tbsp peeled apple","2 tbsp peeled sweet potato","2–3 tbsp water"], steps:["Steam until finger-soft.","Mash with water to a moist texture.","Cool and serve fresh."], safety:"Raw apple chunks are a choking risk.", nutrition:["Fruit","Vitamin A","Fibre"] },
  { id:"nuts", name:"Banana with fine nut powder", tamil:"நட்ஸ் பொடி வாழைப்பழம்", ingredients:["3 tbsp ripe banana","¼ tsp freshly ground introduced nuts"], steps:["Use only nuts introduced individually.","Grind, sieve and mix completely into banana.","Serve moist from a spoon."], safety:"Never offer whole, coarse or dry nuts. Make powder fresh for one serving.", nutrition:["Fruit","Protein","Healthy fat"] }
];

const breakfast = ["idli","appam","neer","thinai","ragi","idiyappam","pongal","kuthiraivali"];
const lunch = ["matta","samba","egg","handrice","matta","samba","kavuni"];
const dinner = ["pongal","idiyappam","curd","appam","neer","thinai"];
const snack = ["fruit","apple","nuts","fruit","apple"];
export const days = Array.from({length:90},(_,i)=>({
  day:i+1, week:Math.floor(i/7)+1,
  meals:[
    ["Breakfast",breakfast[i%breakfast.length]],
    ["Mid-morning",snack[i%snack.length]],
    ["Lunch",lunch[(i+Math.floor(i/7))%lunch.length]],
    ["Evening",snack[(i+2)%snack.length]],
    ["Dinner",dinner[(i+1)%dinner.length]]
  ] as [string,string][]
}));

export const pantry = [
  {name:"Baby dal powder",life:"Make a 3-day dry batch",ingredients:["3 tbsp moong dal","1 tbsp toor dal","1 tbsp roasted gram","Pinch cumin"],steps:["Inspect and dry-roast separately.","Cool fully and grind very fine.","Keep in a sterile dry airtight jar in the coolest dark cupboard.","Cook 1 tsp with ½ cup water for 8–10 minutes."],safety:"Make fresh in hot or humid weather. Discard if damp, clumped or unusual-smelling."},
  {name:"Fine nut powder",life:"Make fresh for one serving",ingredients:["1 introduced almond","½ cashew","½ pistachio"],steps:["Dry-roast and cool.","Grind and sieve immediately.","Mix no more than ¼ tsp fully into moist food."],safety:"Do not store ground nuts without refrigeration."},
  {name:"Curry-leaf sesame podi",life:"Make fresh for one serving",ingredients:["6 curry leaves","1 tsp roasted gram","¼ tsp sesame"],steps:["Wash and dry leaves completely.","Roast until crisp and cool.","Grind fine and mix into hot food."],safety:"Use sesame only if already introduced; do not store leftovers."},
  {name:"Fresh idli — batter + steaming",life:"Cook once; do not store",ingredients:["¾ cup idli rice","¼ cup whole urad dal","⅛ tsp fenugreek","Clean water"],steps:["Soak rice 4–6 hours; soak urad and fenugreek 3–4 hours.","Grind urad fluffy and rice smooth, then combine.","Ferment only until risen and pleasantly fermented; check early in hot weather.","Steam unsalted baby batter 10–12 minutes until set."],safety:"Cook all remaining batter immediately. Never hold batter without refrigeration."}
];

export const tips = [
  "Soak traditional rice and millets well for a softer texture.",
  "Keep boiled warm water nearby to loosen food before serving.",
  "Remove the baby portion before adding salt or family tempering.",
  "Food should flatten easily between two fingers.",
  "Cool roasted ingredients fully before grinding.",
  "Use a clean, completely dry spoon for pantry powders.",
  "Cut idiyappam strands short before serving.",
  "Use only the soft centre of appam.",
  "Cook dal until it loses its shape.",
  "Add ghee after cooking."
];
