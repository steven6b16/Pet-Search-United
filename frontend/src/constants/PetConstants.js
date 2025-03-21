// 寵物類型
export const petTypes = [
  { value: "cat", label: "貓" },
  { value: "dog", label: "狗" },
];

export const catBreeds = [
  { value: 'abyssinian', label: '阿比西尼亞貓' },
  { value: 'aegean', label: '愛琴海貓' },
  { value: 'american_bobtail', label: '美國短尾貓' },
  { value: 'american_curl', label: '美國捲耳貓' },
  { value: 'american_shorthair', label: '美國短毛貓' },
  { value: 'american_wirehair', label: '美國鋼毛貓' },
  { value: 'angora', label: '安哥拉貓' },
  { value: 'arabian_mau', label: '阿拉伯貓' },
  { value: 'asian_semi_longhair', label: '亞洲半長毛貓' },
  { value: 'australian_mist', label: '澳大利亞迷霧貓' },
  { value: 'balinese', label: '峇里貓' },
  { value: 'bambino', label: '巴比諾貓' },
  { value: 'bengal', label: '孟加拉貓/豹貓' }, // 台灣多用「孟加拉貓」，香港常用「豹貓」
  { value: 'birman', label: '伯曼貓' },
  { value: 'bombay', label: '孟買貓' },
  { value: 'british_longhair', label: '英國長毛貓' },
  { value: 'british_shorthair', label: '英國短毛貓' },
  { value: 'burmese', label: '緬甸貓' },
  { value: 'burmilla', label: '波米拉貓/亞洲波米拉貓' }, // 台灣常用「波米拉貓」，香港有時用全名
  { value: 'california_spangled', label: '加州閃亮貓' },
  { value: 'chartreux', label: '沙特爾貓' },
  { value: 'chausie', label: '非洲獅子貓' },
  { value: 'cheetoh', label: '奇多貓' },
  { value: 'chinchilla', label: '金吉拉貓' },
  { value: 'chinchilla_persian', label: '金吉拉波斯貓' },
  { value: 'colorpoint_shorthair', label: '重點色短毛貓' },
  { value: 'cornish_rex', label: '柯尼斯捲毛貓/康瓦爾捲毛貓' }, // 台灣用「柯尼斯」，香港有時用「康瓦爾」
  { value: 'cross_breed_cat', label: '混血貓' },
  { value: 'cymric', label: '威爾斯貓/曼克斯長毛貓' }, // 台灣多用「威爾斯貓」，香港有時用「曼克斯長毛貓」
  { value: 'devon_rex', label: '德文捲毛貓' },
  { value: 'domestick_short_hair_dsh', label: '家貓/唐貓' }, // 已分隔，台灣用「家貓」，香港用「唐貓」
  { value: 'donskoy', label: '唐斯芬克斯貓/頓斯科伊貓' }, // 台灣用「唐斯芬克斯」，香港有時用「頓斯科伊」
  { value: 'dragon_li', label: '狸花貓' },
  { value: 'dwelf', label: '德沃夫貓' },
  { value: 'egyptian_mau', label: '埃及貓' },
  { value: 'english_fold', label: '英格蘭摺耳貓' },
  { value: 'european_burmese', label: '歐洲緬甸貓' },
  { value: 'european_shorthair', label: '歐洲短毛貓' },
  { value: 'exotic_longhair', label: '異國長毛貓' },
  { value: 'exotic_shorthair', label: '異國短毛貓' },
  { value: 'german_rex', label: '德國捲毛貓' },
  { value: 'havana_brown', label: '哈瓦那貓' },
  { value: 'highlander', label: '海蘭德貓' },
  { value: 'himalayan', label: '喜馬拉雅貓' },
  { value: 'japanese_bobtail', label: '日本短尾貓' },
  { value: 'javanese', label: '爪哇貓' },
  { value: 'khao_manee', label: '泰國御貓/考曼尼貓' }, // 台灣用「考曼尼貓」，香港多用「泰國御貓」
  { value: 'korat', label: '科拉特貓' },
  { value: 'laperm', label: '拉邦捲毛貓/法拉毛貓' }, // 台灣用「拉邦捲毛貓」，香港用「法拉毛貓」
  { value: 'maine_coon', label: '緬因貓' },
  { value: 'manx', label: '曼島貓' },
  { value: 'mekong_bobtail', label: '湄公短尾貓/泰國短尾貓' }, // 台灣用「湄公短尾貓」，香港用「泰國短尾貓」
  { value: 'minskin', label: '明斯克貓' },
  { value: 'mixed_breed_cat', label: '混種貓' },
  { value: 'munchkin', label: '曼基貓/短腿貓' }, // 台灣用「曼基貓」，香港常用「短腿貓」
  { value: 'napoleon', label: '拿破侖貓' },
  { value: 'nebelung', label: '尼比龍貓/霧貓' }, // 台灣用「尼比龍貓」，香港有時用「霧貓」
  { value: 'norwegian_forest_cat', label: '挪威森林貓' },
  { value: 'ocicat', label: '歐西貓' },
  { value: 'ojos_azules', label: '藍眼貓/歐斯亞史烈斯貓' }, // 台灣用「藍眼貓」，香港用「歐斯亞史烈斯貓」
  { value: 'oriental_longhair', label: '東方長毛貓' },
  { value: 'oriental_shorthair', label: '東方短毛貓' },
  { value: 'peke_faced', label: '獅子狗臉波斯貓' },
  { value: 'persian', label: '波斯貓' },
  { value: 'peterbald', label: '彼得堡無毛貓/彼得禿貓' }, // 台灣用「彼得堡無毛貓」，香港用「彼得禿貓」
  { value: 'pixie_bob', label: '皮克斯短尾貓/北美洲短毛貓' }, // 台灣用「皮克斯短尾貓」，香港用「北美洲短毛貓」
  { value: 'ragamuffin', label: '拉格瑪芬貓/襤褸貓' }, // 台灣用「拉格瑪芬貓」，香港用「襤褸貓」
  { value: 'ragdoll', label: '布偶貓' },
  { value: 'russian_blue', label: '俄羅斯藍貓/俄國藍貓' }, // 台灣用「俄羅斯藍貓」，香港用「俄國藍貓」
  { value: 'sam_sawet', label: '暹羅貓' },
  { value: 'savannah', label: '薩凡納貓/熱帶草原貓' }, // 台灣用「薩凡納貓」，香港用「熱帶草原貓」
  { value: 'scottish_fold_coupari', label: '蘇格蘭摺耳貓' },
  { value: 'scottish_shorthair', label: '蘇格蘭短毛貓' },
  { value: 'selkirk_rex', label: '塞爾凱克捲毛貓/塞扣克帝王貓' }, // 台灣用「塞爾凱克捲毛貓」，香港用「塞扣克帝王貓」
  { value: 'serengeti', label: '塞倫蓋蒂貓' },
  { value: 'siamese', label: '暹羅貓' },
  { value: 'siberian', label: '西伯利亞貓' },
  { value: 'singapura', label: '新加坡貓' },
  { value: 'snowshoe', label: '雪鞋貓' },
  { value: 'sokoke', label: '索科克貓/非洲短毛貓' }, // 台灣用「索科克貓」，香港用「非洲短毛貓」
  { value: 'somali', label: '索馬利貓/索馬利亞貓' }, // 台灣用「索馬利貓」，香港用「索馬利亞貓」
  { value: 'sphynx', label: '斯芬克斯貓/加拿大無毛貓' }, // 台灣用「斯芬克斯貓」，香港用「加拿大無毛貓」
  { value: 'tabby_longhair', label: '長毛虎斑貓' },
  { value: 'tabby_shorthair', label: '短毛虎斑貓' },
  { value: 'thai', label: '泰國貓' },
  { value: 'tiffany_chantilly', label: '蒂芙尼貓/查達利貓' }, // 台灣用「蒂芙尼貓」，香港用「查達利貓」
  { value: 'tonkinese', label: '東金貓/東奇尼貓' }, // 台灣用「東金貓」，香港用「東奇尼貓」
  { value: 'toyger', label: '玩具虎貓' },
  { value: 'turkish_angora', label: '土耳其安哥拉貓' },
  { value: 'turkish_van', label: '土耳其梵貓/土耳其凡城拉貓' }, // 台灣用「土耳其梵貓」，香港用「土耳其凡城拉貓」
  { value: 'ukrainian_levkoy', label: '烏克蘭利夫科伊貓/勒夫科伊貓' }, // 台灣用「烏克蘭利夫科伊貓」，香港用「勒夫科伊貓」
  { value: 'york_chocolate', label: '約克巧克力貓/約克巧克力特貓' } // 台灣用「約克巧克力貓」，香港用「約克巧克力特貓」
];
  
export const dogBreeds = [
  { value: 'affenpinscher', label: '猴面㹴犬/猴㹴犬' }, // 台灣用「猴面㹴犬」，香港用「猴㹴犬」
  { value: 'afghan_hound', label: '阿富汗獵犬' },
  { value: 'airedale_terrier', label: '萬能㹴犬' },
  { value: 'akita', label: '秋田犬' },
  { value: 'alaskan_malamute', label: '阿拉斯加雪橇犬' },
  { value: 'american_eskimo_dog', label: '美國愛斯基摩犬' },
  { value: 'american_water_spaniel', label: '美國水獵犬' },
  { value: 'anatolian_shepherd_dog', label: '安納托利亞牧羊犬/安那托利亞牧羊犬' }, // 台灣用「安納托利亞」，香港用「安那托利亞」
  { value: 'australian_cattle_dog', label: '澳洲牧牛犬' },
  { value: 'australian_shepherd', label: '澳洲牧羊犬' },
  { value: 'australian_silky_terrier', label: '澳洲絲毛㹴犬/絲毛梗犬' }, // 台灣用「澳洲絲毛㹴犬」，香港用「絲毛梗犬」
  { value: 'australian_terrier', label: '澳洲㹴犬/澳大利亞㹴犬' }, // 台灣用「澳洲㹴犬」，香港用「澳大利亞㹴犬」
  { value: 'azawakh', label: '阿札瓦克犬/阿沙瓦犬' }, // 台灣用「阿札瓦克犬」，香港用「阿沙瓦犬」
  { value: 'basenji', label: '巴辛吉犬' },
  { value: 'basset_bleu_de_gascogne', label: '藍加斯科尼矮腿獵犬' },
  { value: 'basset_fauve_de_bretagne', label: '布列塔尼短腿獵犬' },
  { value: 'basset_hound', label: '巴吉度獵犬/巴薩亨犬' }, // 台灣用「巴吉度獵犬」，香港用「巴薩亨犬」
  { value: 'bavarian_mountain_hound', label: '巴伐利亞山地犬' },
  { value: 'beagle', label: '比格犬/比高犬' }, // 台灣用「比格犬」，香港用「比高犬」
  { value: 'bearded_collie', label: '長鬚牧羊犬/古代長鬚牧羊犬' }, // 台灣用「長鬚牧羊犬」，香港用「古代長鬚牧羊犬」
  { value: 'beauceron', label: '博瑟隆犬/法蘭西野狼犬' }, // 台灣用「博瑟隆犬」，香港用「法蘭西野狼犬」
  { value: 'bedlington_terrier', label: '貝德靈頓㹴犬/貝林登犬' }, // 台灣用「貝德靈頓㹴犬」，香港用「貝林登犬」
  { value: 'bergamasco', label: '貝爾加馬斯科牧羊犬/貝加馬斯卡犬' }, // 台灣用「貝爾加馬斯科牧羊犬」，香港用「貝加馬斯卡犬」
  { value: 'bernese_mountain_dog', label: '伯恩山犬' },
  { value: 'bichon_frise', label: '比熊犬' },
  { value: 'black_and_tan_english_toy_terrier', label: '英國玩具梗犬' },
  { value: 'bloodhound', label: '尋血獵犬' },
  { value: 'bolognese', label: '博洛尼亞犬' },
  { value: 'border_collie', label: '邊境牧羊犬/邊界牧羊犬' }, // 台灣用「邊境牧羊犬」，香港用「邊界牧羊犬」
  { value: 'border_terrier', label: '邊境㹴犬/邊境梗犬' }, // 台灣用「邊境㹴犬」，香港用「邊境梗犬」
  { value: 'borzoi', label: '俄羅斯獵狼犬/波索犬' }, // 台灣用「俄羅斯獵狼犬」，香港用「波索犬」
  { value: 'boston_terrier', label: '波士頓㹴犬/波士頓爹利犬' }, // 台灣用「波士頓㹴犬」，香港用「波士頓爹利犬」
  { value: 'bouvier_des_flandres', label: '弗蘭德斯牧羊犬/法蘭德斯牧羊犬' }, // 台灣用「弗蘭德斯」，香港用「法蘭德斯」
  { value: 'boxer', label: '拳師犬' },
  { value: 'bracco_italiano', label: '意大利布拉可犬' },
  { value: 'briard', label: '布里牧羊犬/伯瑞犬' }, // 台灣用「布里牧羊犬」，香港用「伯瑞犬」
  { value: 'brittany', label: '布列塔尼獵犬/不列塔尼犬' }, // 台灣用「布列塔尼獵犬」，香港用「不列塔尼犬」
  { value: 'bull_terrier_new', label: '牛頭㹴犬/牛頭梗犬' }, // 台灣用「牛頭㹴犬」，香港用「牛頭梗犬」
  { value: 'bulldog', label: '鬥牛犬/老虎犬' }, // 台灣用「鬥牛犬」，香港用「老虎犬」
  { value: 'bullmastiff', label: '牛獒犬/鬥牛獒犬' }, // 台灣用「牛獒犬」，香港用「鬥牛獒犬」
  { value: 'cairn_terrier', label: '凱恩㹴犬' },
  { value: 'canaan_dog', label: '迦南犬' },
  { value: 'catalan_sheepdog', label: '加泰羅尼亞牧羊犬' },
  { value: 'caucasian_shepherd_dog', label: '高加索牧羊犬/高加索犬' }, // 台灣用「高加索牧羊犬」，香港用「高加索犬」
  { value: 'cavalier_king_charles_spaniel', label: '查理士王小獵犬/騎士查理王獵犬' }, // 台灣用「查理士王小獵犬」，香港用「騎士查理王獵犬」
  { value: 'cesky_terrier', label: '捷克㹴犬/捷克梗犬' }, // 台灣用「捷克㹴犬」，香港用「捷克梗犬」
  { value: 'chesapeake_bay_retriever', label: '切薩皮克灣尋回犬/乞沙比克獵犬' }, // 台灣用「切薩皮克灣尋回犬」，香港用「乞沙比克獵犬」
  { value: 'chihuahua', label: '吉娃娃/芝娃娃' }, // 台灣用「吉娃娃」，香港用「芝娃娃」
  { value: 'chinese_crested_dog', label: '中國冠毛犬' },
  { value: 'chow_chow', label: '鬆獅犬' },
  { value: 'cirneco_dell_etna', label: '西西里獵犬' },
  { value: 'clumber_spaniel', label: '克倫伯獵犬/克倫伯犬' }, // 台灣用「克倫伯獵犬」，香港用「克倫伯犬」
  { value: 'cocker_spaniel', label: '可卡獵犬/曲架犬' }, // 台灣用「可卡獵犬」，香港用「曲架犬」
  { value: 'coton_de_tulear', label: '圖萊亞棉花犬/棉花面紗犬' }, // 台灣用「圖萊亞棉花犬」，香港用「棉花面紗犬」
  { value: 'cross_breed_dog', label: '混血犬' },
  { value: 'curly_coated_retriever', label: '卷毛尋回犬' },
  { value: 'dachshund', label: '臘腸犬' },
  { value: 'dalmatian', label: '斑點狗/大麥町犬' }, // 台灣用「斑點狗」，香港用「大麥町犬」
  { value: 'dandie_dinmont_terrier', label: '丹第丁蒙㹴犬/丹迪丁蒙梗犬' }, // 台灣用「丹第丁蒙㹴犬」，香港用「丹迪丁蒙梗犬」
  { value: 'deerhound', label: '蘇格蘭獵鹿犬' },
  { value: 'dobermann', label: '杜賓犬/都柏文犬' }, // 台灣用「杜賓犬」，香港用「都柏文犬」
  { value: 'dogue_de_bordeaux', label: '波爾多獒犬/波爾多犬' }, // 台灣用「波爾多獒犬」，香港用「波爾多犬」
  { value: 'english_setter', label: '英國塞特犬' },
  { value: 'english_springer_spaniel', label: '英國史賓格獵犬/英國史賓格犬' }, // 台灣用「英國史賓格獵犬」，香港用「英國史賓格犬」
  { value: 'estrela_mountain_dog', label: '艾斯特雷拉山犬/埃什特雷拉山犬' }, // 台灣用「艾斯特雷拉山犬」，香港用「埃什特雷拉山犬」
  { value: 'eurasier', label: '歐亞犬' },
  { value: 'field_spaniel', label: '田野獵犬' },
  { value: 'finnish_lapphund', label: '芬蘭拉普牧羊犬/芬蘭拉普獵犬' }, // 台灣用「芬蘭拉普牧羊犬」，香港用「芬蘭拉普獵犬」
  { value: 'finnish_spitz', label: '芬蘭獵犬' },
  { value: 'flat_coated_retriever', label: '平毛尋回犬' },
  { value: 'fox_terrier', label: '獵狐㹴犬/獵狐爹利犬' }, // 台灣用「獵狐㹴犬」，香港用「獵狐爹利犬」
  { value: 'foxhound', label: '英國獵狐犬' },
  { value: 'french_bulldog', label: '法國鬥牛犬/法國老虎犬' }, // 台灣用「法國鬥牛犬」，香港用「法國老虎犬」
  { value: 'german_pinscher', label: '德國品犬/德國迷你品犬' }, // 台灣用「德國品犬」，香港用「德國迷你品犬」
  { value: 'german_shepherd_dog', label: '德國牧羊犬' },
  { value: 'german_spitz', label: '德國狐狸犬' },
  { value: 'glen_of_imaal_terrier', label: '格蘭依瑪爾㹴犬/峽谷依馬爾梗犬' }, // 台灣用「格蘭依瑪爾㹴犬」，香港用「峽谷依馬爾梗犬」
  { value: 'golden_retriever', label: '黃金獵犬/金毛尋回犬' }, // 台灣用「黃金獵犬」，香港用「金毛尋回犬」
  { value: 'gordon_setter', label: '戈登塞特犬/哥頓塞特犬' }, // 台灣用「戈登塞特犬」，香港用「哥頓塞特犬」
  { value: 'grand_basset_griffon_vendeen', label: '大型貝吉格里芬凡丁犬/貝吉格裏芬凡丁犬' }, // 台灣用「大型貝吉格里芬凡丁犬」，香港用「貝吉格裏芬凡丁犬」
  { value: 'great_dane', label: '大丹犬' },
  { value: 'greater_swiss_mountain_dog', label: '大瑞士山地犬' },
  { value: 'greenland_dog', label: '格陵蘭犬/格林蘭犬' }, // 台灣用「格陵蘭犬」，香港用「格林蘭犬」
  { value: 'greyhound', label: '靈緹犬' },
  { value: 'griffon_bruxellois', label: '布魯塞爾格里芬犬/布魯塞爾格林芬犬' }, // 台灣用「布魯塞爾格里芬犬」，香港用「布魯塞爾格林芬犬」
  { value: 'groenendael_belgian_shepherd_dog', label: '比利時牧羊犬' },
  { value: 'hamiltonstovare', label: '漢密爾頓獵犬' },
  { value: 'havanese', label: '哈瓦那犬/哈威那犬' }, // 台灣用「哈瓦那犬」，香港用「哈威那犬」
  { value: 'hovawart', label: '霍瓦瓦特犬/霍夫瓦爾特犬' }, // 台灣用「霍瓦瓦特犬」，香港用「霍夫瓦爾特犬」
  { value: 'hungarian_kuvasz', label: '庫瓦茲犬/哥威斯犬' }, // 台灣用「庫瓦茲犬」，香港用「哥威斯犬」
  { value: 'hungarian_puli', label: '普利犬/波利犬' }, // 台灣用「普利犬」，香港用「波利犬」
  { value: 'hungarian_vizsla', label: '維茲拉犬' },
  { value: 'hungarian_wirehaired_vizsla', label: '剛毛維茲拉犬' },
  { value: 'ibizan_hound', label: '伊比沙獵犬/依比沙獵犬' }, // 台灣用「伊比沙獵犬」，香港用「依比沙獵犬」
  { value: 'irish_red_and_white_setter', label: '愛爾蘭紅白塞特犬/愛爾蘭紅白雪達犬' }, // 台灣用「愛爾蘭紅白塞特犬」，香港用「愛爾蘭紅白雪達犬」
  { value: 'irish_setter', label: '愛爾蘭塞特犬/愛爾蘭雪達犬' }, // 台灣用「愛爾蘭塞特犬」，香港用「愛爾蘭雪達犬」
  { value: 'irish_terrier', label: '愛爾蘭㹴犬/愛爾蘭梗犬' }, // 台灣用「愛爾蘭㹴犬」，香港用「愛爾蘭梗犬」
  { value: 'irish_water_spaniel', label: '愛爾蘭水獵犬' },
  { value: 'irish_wolfhound', label: '愛爾蘭獵狼犬' },
  { value: 'italian_greyhound', label: '意大利靈緹犬/意大利格雷伊獵犬' }, // 台灣用「意大利靈緹犬」，香港用「意大利格雷伊獵犬」
  { value: 'italian_spinone', label: '意大利斯皮諾犬/史華諾犬' }, // 台灣用「意大利斯皮諾犬」，香港用「史華諾犬」
  { value: 'jack_russell_terrier', label: '傑克羅素㹴犬/積羅素犬' }, // 台灣用「傑克羅素㹴犬」，香港用「積羅素犬」
  { value: 'japanese_akita_inu', label: '日本秋田犬' },
  { value: 'japanese_chin', label: '日本狆犬' },
  { value: 'japanese_shiba_inu', label: '柴犬' },
  { value: 'japanese_spitz', label: '日本銀狐犬/銀狐犬' }, // 台灣用「日本銀狐犬」，香港用「銀狐犬」
  { value: 'keeshond', label: '荷蘭毛獅犬' },
  { value: 'kerry_blue_terrier', label: '凱利藍㹴犬/凱利藍爹利犬' }, // 台灣用「凱利藍㹴犬」，香港用「凱利藍爹利犬」
  { value: 'komondor', label: '可蒙多犬/可蒙犬' }, // 台灣用「可蒙多犬」，香港用「可蒙犬」
  { value: 'kooikerhondje', label: '荷蘭引鴨犬/科克爾犬' }, // 台灣用「荷蘭引鴨犬」，香港用「科克爾犬」
  { value: 'korean_jindo', label: '韓國珍島犬' },
  { value: 'korthals_griffon', label: '科爾特斯格里芬犬/科薩斯格裏芬犬' }, // 台灣用「科爾特斯格里芬犬」，香港用「科薩斯格裏芬犬」
  { value: 'labrador_retriever', label: '拉布拉多尋回犬' },
  { value: 'laekenois_belgian_shepherd_dog', label: '拉坎諾牧羊犬/拉坎諾斯牧羊犬' }, // 台灣用「拉坎諾牧羊犬」，香港用「拉坎諾斯牧羊犬」
  { value: 'lagotto_romagnolo', label: '羅曼諾水犬/拉戈托羅馬閣挪露犬' }, // 台灣用「羅曼諾水犬」，香港用「拉戈托羅馬閣挪露犬」
  { value: 'lakeland_terrier', label: '湖區㹴犬/湖畔梗犬' }, // 台灣用「湖區㹴犬」，香港用「湖畔梗犬」
  { value: 'lancashire_heeler', label: '蘭開夏牧牛犬/蘭開夏赫勒犬' }, // 台灣用「蘭開夏牧牛犬」，香港用「蘭開夏赫勒犬」
  { value: 'leonberger', label: '萊昂伯格犬/蘭伯格犬' }, // 台灣用「萊昂伯格犬」，香港用「蘭伯格犬」
  { value: 'lhasa_apso', label: '拉薩犬' },
  { value: 'lowchen', label: '小獅犬/羅秦犬' }, // 台灣用「小獅犬」，香港用「羅秦犬」
  { value: 'malinois_belgian_shepherd_dog', label: '馬林諾斯牧羊犬/比利時馬連萊犬' }, // 台灣用「馬林諾斯牧羊犬」，香港用「比利時馬連萊犬」
  { value: 'maltese', label: '馬爾濟斯犬/魔天使犬' }, // 台灣用「馬爾濟斯犬」，香港用「魔天使犬」
  { value: 'manchester_terrier', label: '曼徹斯特㹴犬/曼徹斯特梗犬' }, // 台灣用「曼徹斯特㹴犬」，香港用「曼徹斯特梗犬」
  { value: 'maremma_sheepdog', label: '馬瑞馬牧羊犬' },
  { value: 'mastiff', label: '馬士提夫犬' },
  { value: 'mexican_hairless', label: '墨西哥無毛犬' },
  { value: 'miniature_pinscher', label: '迷你杜賓犬/迷你品犬' }, // 台灣用「迷你杜賓犬」，香港用「迷你品犬」
  { value: 'miniature_poodle', label: '貴賓犬/貴婦犬' }, // 台灣用「貴賓犬」，香港用「貴婦犬」
  { value: 'mixed_breed_dog', label: '混種犬/唐狗' }, // 已分隔，台灣用「混種犬」，香港用「唐狗」
  { value: 'munsterlander', label: '明斯特蘭德犬' },
  { value: 'neapolitan_mastiff', label: '那不勒斯獒犬' },
  { value: 'newfoundland', label: '紐芬蘭犬' },
  { value: 'norfolk_terrier', label: '諾福克㹴犬/諾福克梗犬' }, // 台灣用「諾福克㹴犬」，香港用「諾福克梗犬」
  { value: 'norwegian_buhund', label: '挪威布哈德犬/挪威牧羊犬' }, // 台灣用「挪威布哈德犬」，香港用「挪威牧羊犬」
  { value: 'norwegian_elkhound', label: '挪威獵麋犬' },
  { value: 'norwich_terrier', label: '諾威奇㹴犬/羅威士梗犬' }, // 台灣用「諾威奇㹴犬」，香港用「羅威士梗犬」
  { value: 'nova_scotia_duck_tolling_retriever', label: '新斯科舍誘鴨尋回犬/新斯科細亞誘鴨尋回犬' }, // 台灣用「新斯科舍」，香港用「新斯科細亞」
  { value: 'old_english_sheepdog', label: '英國古代牧羊犬' },
  { value: 'otterhound', label: '獺獵犬/奧達獵犬' }, // 台灣用「獺獵犬」，香港用「奧達獵犬」
  { value: 'papillon', label: '蝴蝶犬' },
  { value: 'parson_russell_terrier', label: '帕森羅素㹴犬/柏森羅素梗犬' }, // 台灣用「帕森羅素㹴犬」，香港用「柏森羅素梗犬」
  { value: 'pekingese', label: '北京犬' },
  { value: 'petit_basset_griffon_vendeen', label: '小型貝吉格里芬凡丁犬/迷你貝吉格里芬凡丁犬' }, // 台灣用「小型貝吉格里芬凡丁犬」，香港用「迷你貝吉格里芬凡丁犬」
  { value: 'pharaoh_hound', label: '法老王獵犬' },
  { value: 'pointer', label: '英國指示犬' },
  { value: 'polish_lowland_sheepdog', label: '波蘭低地牧羊犬' },
  { value: 'pomeranian', label: '博美犬/松鼠犬' }, // 台灣用「博美犬」，香港用「松鼠犬」
  { value: 'portuguese_water_dog', label: '葡萄牙水犬' },
  { value: 'pug', label: '巴哥犬/八哥犬' }, // 台灣用「巴哥犬」，香港用「八哥犬」
  { value: 'pyrenean_mastiff', label: '比利牛斯獒犬' },
  { value: 'pyrenean_mountain_dog', label: '大白熊犬' },
  { value: 'pyrenean_sheepdog', label: '比利牛斯牧羊犬' },
  { value: 'rhodesian_ridgeback', label: '羅德西亞背脊犬/羅德西亞山脈犬' }, // 台灣用「羅德西亞背脊犬」，香港用「羅德西亞山脈犬」
  { value: 'rottweiler', label: '羅威納犬/洛威拿犬' }, // 台灣用「羅威納犬」，香港用「洛威拿犬」
  { value: 'rough_collie', label: '長毛柯利犬/粗毛牧羊犬' }, // 台灣用「長毛柯利犬」，香港用「粗毛牧羊犬」
  { value: 'russian_black_terrier', label: '俄羅斯黑㹴犬/俄羅斯梗犬' }, // 台灣用「俄羅斯黑㹴犬」，香港用「俄羅斯梗犬」
  { value: 'saint_bernard', label: '聖伯納犬/聖班納犬' }, // 台灣用「聖伯納犬」，香港用「聖班納犬」
  { value: 'saluki', label: '沙盧基犬/沙路奇獵犬' }, // 台灣用「沙盧基犬」，香港用「沙路奇獵犬」
  { value: 'samoyed', label: '薩摩耶犬' },
  { value: 'schipperke', label: '斯基珀基犬/舒柏奇犬' }, // 台灣用「斯基珀基犬」，香港用「舒柏奇犬」
  { value: 'schnauzer', label: '雪納瑞犬/史納莎犬' }, // 台灣用「雪納瑞犬」，香港用「史納莎犬」
  { value: 'scottish_terrier', label: '蘇格蘭㹴犬/蘇格蘭爹利犬' }, // 台灣用「蘇格蘭㹴犬」，香港用「蘇格蘭爹利犬」
  { value: 'sealyham_terrier', label: '西利哈姆㹴犬/西里漢犬' }, // 台灣用「西利哈姆㹴犬」，香港用「西里漢犬」
  { value: 'segugio_italiano', label: '意大利獵犬' },
  { value: 'shar_pei', label: '沙皮犬' },
  { value: 'shetland_sheepdog', label: '喜樂蒂牧羊犬/小型牧羊犬' }, // 台灣用「喜樂蒂牧羊犬」，香港用「小型牧羊犬」
  { value: 'shih_tzu', label: '西施犬' },
  { value: 'siberian_husky', label: '西伯利亞雪橇犬/哈士奇' }, // 已分隔，台灣用「西伯利亞雪橇犬」，香港用「哈士奇」
  { value: 'skye_terrier', label: '斯凱㹴犬/斯凱島梗犬' }, // 台灣用「斯凱㹴犬」，香港用「斯凱島梗犬」
  { value: 'sloughi', label: '斯盧基犬/北非獵犬' }, // 台灣用「斯盧基犬」，香港用「北非獵犬」
  { value: 'smooth_collie', label: '短毛柯利犬/短毛牧羊犬' }, // 台灣用「短毛柯利犬」，香港用「短毛牧羊犬」
  { value: 'soft_coated_wheaten_terrier', label: '軟毛麥色㹴犬/愛爾蘭軟毛梗犬' }, // 台灣用「軟毛麥色㹴犬」，香港用「愛爾蘭軟毛梗犬」
  { value: 'spanish_water_dog', label: '西班牙水犬' },
  { value: 'stafforshire_bull_terrier', label: '斯塔福郡鬥牛㹴犬/史特富郡鬥牛梗犬' }, // 台灣用「斯塔福郡鬥牛㹴犬」，香港用「史特富郡鬥牛梗犬」
  { value: 'sussex_spaniel', label: '薩塞克斯獵犬/塞式獵犬' }, // 台灣用「薩塞克斯獵犬」，香港用「塞式獵犬」
  { value: 'swedish_lapphund', label: '瑞典拉普牧羊犬/瑞典拉普獵犬' }, // 台灣用「瑞典拉普牧羊犬」，香港用「瑞典拉普獵犬」
  { value: 'swedish_vallhund', label: '瑞典瓦爾亨犬/瑞典瓦漢德犬' }, // 台灣用「瑞典瓦爾亨犬」，香港用「瑞典瓦漢德犬」
  { value: 'tervueren_belgian_shepherd_dog', label: '特伏倫牧羊犬/比利時坦比連犬' }, // 台灣用「特伏倫牧羊犬」，香港用「比利時坦比連犬」
  { value: 'tibetan_mastiff', label: '藏獒犬' },
  { value: 'tibetan_spaniel', label: '西藏獵犬' },
  { value: 'tibetan_terrier', label: '西藏㹴犬' },
  { value: 'warren_hound_portuguese_podengo', label: '葡萄牙波登哥犬/葡萄牙波登可犬' }, // 台灣用「葡萄牙波登哥犬」，香港用「葡萄牙波登可犬」
  { value: 'weimaraner', label: '威瑪獵犬/威瑪犬' }, // 台灣用「威瑪獵犬」，香港用「威瑪犬」
  { value: 'welsh_corgi', label: '威爾斯柯基犬/哥基犬' }, // 台灣用「威爾斯柯基犬」，香港用「哥基犬」
  { value: 'welsh_springer_spaniel', label: '威爾斯史賓格獵犬' },
  { value: 'welsh_terrier', label: '威爾斯㹴犬' },
  { value: 'west_highland_white_terrier', label: '西高地白㹴犬/西部高地白爹利犬' }, // 台灣用「西高地白㹴犬」，香港用「西部高地白爹利犬」
  { value: 'whippet', label: '惠比特犬' },
  { value: 'yorkshire_terrier', label: '約克夏㹴犬/約瑟爹利犬' } // 台灣用「約克夏㹴犬」，香港用「約瑟爹利犬」
];

// 花色選項
export const catPatterns = [
  { value: "solid", label: "單色", icon: "solid-icon" },
  { value: "bicolor", label: "雙色", icon: "bicolor-icon" },
  { value: "tricolor", label: "三色", icon: "tricolor-icon" },
  { value: "tortoiseshell", label: "玳瑁色", icon: "tortoiseshell-icon" },
  { value: "tabby", label: "虎斑", icon: "tabby-icon" },
  { value: "pointed", label: "重點色", icon: "pointed-icon" },
  { value: "parti", label: "花斑", icon: "parti-icon" },
  { value: "other", label: "其他", icon: "other-icon" },
];

export const dogPatterns = [
  { value: "solid", label: "單色", icon: "solid-icon" },
  { value: "bicolor", label: "雙色", icon: "bicolor-icon" },
  { value: "tricolor", label: "三色", icon: "tricolor-icon" },
  { value: "brindle", label: "虎斑", icon: "brindle-icon" },
  { value: "merle", label: "斑點", icon: "merle-icon" },
  { value: "sable", label: "鞍形", icon: "sable-icon" },
  { value: "pointed", label: "重點色", icon: "pointed-icon" },
  { value: "parti", label: "花斑", icon: "parti-icon" },
  { value: "other", label: "其他", icon: "other-icon" },
];

// 顏色選項（貓狗通用）
export const petColors = [
  { value: "black", label: "黑色", color: "#000000" },
  { value: "white", label: "白色", color: "#FFFFFF" },
  { value: "brown", label: "棕色", color: "#8B4513" },
  { value: "gray", label: "灰色", color: "#808080" },
  { value: "orange", label: "橙色", color: "#FFA500" },
  { value: "gold", label: "金色", color: "#FFD700" },
  { value: "cream", label: "奶油色", color: "#FFFDD0" },
  { value: "blue", label: "藍色", color: "#4682B4" },
  { value: "chocolate", label: "巧克力色", color: "#D2691E" },
  { value: "lilac", label: "淡紫色", color: "#C8A2C8" },
];

// 毛型選項
export const catCoatTypes = [
  { value: "shorthair", label: "短毛", icon: "shorthair-icon" },
  { value: "longhair", label: "長毛", icon: "longhair-icon" },
  { value: "curlyhair", label: "捲毛", icon: "curlyhair-icon" },
  { value: "hairless", label: "無毛", icon: "hairless-icon" },
];

export const dogCoatTypes = [
  { value: "shorthair", label: "短毛", icon: "shorthair-icon" },
  { value: "longhair", label: "長毛", icon: "longhair-icon" },
  { value: "wirehair", label: "硬毛", icon: "wirehair-icon" },
  { value: "curlyhair", label: "捲毛", icon: "curlyhair-icon" },
  { value: "hairless", label: "無毛", icon: "hairless-icon" },
  { value: "doublecoat", label: "雙層毛", icon: "doublecoat-icon" },
];

  export const petage = [
    { value: 'lt3m', label: '13週以下' },
    { value: '13w11m', label: '13週至11個月' },
    { value: '1y', label: '1歲' },
    { value: '2y', label: '2歲' },
    { value: '3y', label: '3歲' },
    { value: '4y', label: '4歲' },
    { value: '5y', label: '5歲' },
    { value: '6y', label: '6歲' },
    { value: '7y', label: '7歲' },
    { value: '8y', label: '8歲' },
    { value: '9y', label: '9歲' },
    { value: '10y', label: '10歲' },
    { value: '11y', label: '11歲' },
    { value: '12y', label: '12歲' },
    { value: '13y', label: '13歲' },
    { value: '14y', label: '14歲' },
    { value: 'me15y', label: '15歲或以上' },
  ];

  export const petstatus = [
    { value: 'no', label: '仍在流浪' },
    { value: 'yes', label: '已安置' }
  ];

// 香港 18 區列表
export const hongKongDistricts = [
  { value: '', label: '全部地區' },
  { value: 'Central and Western', label: '中西區' },
  { value: 'Eastern', label: '東區' },
  { value: 'Southern', label: '南區' },
  { value: 'Wan Chai', label: '灣仔區' },
  { value: 'Sham Shui Po', label: '深水埗區' },
  { value: 'Kowloon City', label: '九龍城區' },
  { value: 'Kwun Tong', label: '觀塘區' },
  { value: 'Wong Tai Sin', label: '黃大仙區' },
  { value: 'Yau Tsim Mong', label: '油尖旺區' },
  { value: 'Islands', label: '離島區' },
  { value: 'Kwai Tsing', label: '葵青區' },
  { value: 'North', label: '北區' },
  { value: 'Sai Kung', label: '西貢區' },
  { value: 'Sha Tin', label: '沙田區' },
  { value: 'Tai Po', label: '大埔區' },
  { value: 'Tsuen Wan', label: '荃灣區' },
  { value: 'Tuen Mun', label: '屯門區' },
  { value: 'Yuen Long', label: '元朗區' },
];
