export interface SubsidyInfo {
  no: number;
  ward: string;
  hasSubsidy: boolean;
  subsidyRate?: string;
  maxAmount?: number;
  taxType?: '税込' | '税別';
  condition?: string;
  applicationMethod?: '購入前' | '購入後' | '購入前後';
  storeDesignation?: string;
  contactDepartment?: string;
}

export const gomiData: SubsidyInfo[] = [
  { no: 1, ward: "千代田区", hasSubsidy: true, subsidyRate: "2/3", maxAmount: 30000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "千代田清掃事務所" },
  { no: 2, ward: "中央区", hasSubsidy: false, contactDepartment: "清掃事務所" },
  { no: 3, ward: "港区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "みなとリサイクル清掃事務所 ごみ減量・資源化推進係" },
  { no: 4, ward: "新宿区", hasSubsidy: false, contactDepartment: "リサイクル清掃 事業計画係" },
  { no: 5, ward: "文京区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "リサイクル清掃 リサイクル推進係" },
  { no: 6, ward: "台東区", hasSubsidy: false, contactDepartment: "清播リサイクル" },
  { no: 7, ward: "墨田区", hasSubsidy: false, contactDepartment: "環境政策課 環境政策担当" },
  { no: 8, ward: "江東区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "清揚リサイクル 清掃リサイクル係" },
  { no: 9, ward: "品川区", hasSubsidy: true, subsidyRate: "1/3", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "清掃事務所 資源循環推進係" },
  { no: 10, ward: "目黒区", hasSubsidy: false, contactDepartment: "清揚リサイクル課" },
  { no: 11, ward: "大田区", hasSubsidy: false, contactDepartment: "環境清掃管理課" },
  { no: 12, ward: "世田谷区", hasSubsidy: false, contactDepartment: "環境清掃管理課" },
  { no: 13, ward: "渋谷区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "リサイクル課" },
  { no: 14, ward: "中野区", hasSubsidy: false, contactDepartment: "ごみゼロ推進課" },
  { no: 15, ward: "杉並区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入前後", storeDesignation: "指定なし", contactDepartment: "環境部 ごみ減量対策課 事業計画係" },
  { no: 16, ward: "豊島区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "ごみ減量推進課 事業推進グループ" },
  { no: 17, ward: "北区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "生活環境部 リサイクル清掃課" },
  { no: 18, ward: "荒川区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "清掃リサイクル推進課 管理計画係" },
  { no: 19, ward: "板橋区", hasSubsidy: false, contactDepartment: "清揚リサイクル" },
  { no: 20, ward: "練馬区", hasSubsidy: false, contactDepartment: "清揚リサイクル リサイクル推進課" },
  { no: 21, ward: "足立区", hasSubsidy: true, subsidyRate: "2/3", maxAmount: 30000, taxType: "税別", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "ごみ減量推進課 資源化推進係" },
  { no: 22, ward: "葛飾区", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "リサイクル清掃課 ごみ減量推進係" },
  { no: 23, ward: "江戸川区", hasSubsidy: false, contactDepartment: "清播" },
  { no: 24, ward: "八王子市", hasSubsidy: false, contactDepartment: "ごみ減量対策課" },
  { no: 25, ward: "立川市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 25000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "ごみ対策課" },
  { no: 26, ward: "武蔵野市", hasSubsidy: false, contactDepartment: "環境部 ごみ総合対策課" },
  { no: 27, ward: "三鷹市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税別", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "生活環境部 ごみ対策課" },
  { no: 28, ward: "青梅市", hasSubsidy: false, contactDepartment: "環境部 リサイクル課" },
  { no: 29, ward: "府中市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "生活環境部 資源循環推進課 ごみ対策課 ごみ減量係" },
  { no: 30, ward: "昭島市", hasSubsidy: true, subsidyRate: "2/3", maxAmount: 30000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "自治体内販売店", contactDepartment: "環境部 資源循環推進課" },
  { no: 31, ward: "調布市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "環境資源部 3R推進課 推進係" },
  { no: 32, ward: "町田市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "環境資源部 3R推進課 推進係" },
  { no: 33, ward: "小金井市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 30000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "ごみ対策課 減量推進係" },
  { no: 34, ward: "小平市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 30000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "資源循環課 推進担当" },
  { no: 35, ward: "日野市", hasSubsidy: false, contactDepartment: "ごみゼロ推進課" },
  { no: 36, ward: "東村山市", hasSubsidy: false, contactDepartment: "資源循環部 ごみ減量推進課" },
  { no: 37, ward: "国分寺市", hasSubsidy: true, subsidyRate: "2/3", maxAmount: 30000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "建設環境部 ごみ減量推進課" },
  { no: 38, ward: "国立市", hasSubsidy: false, contactDepartment: "生活環境部 ごみ減量課 播係" },
  { no: 39, ward: "福生市", hasSubsidy: false, contactDepartment: "ごみ総合受付センター" },
  { no: 40, ward: "狛江市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 18000, taxType: "税別", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "清播課" },
  { no: 41, ward: "東大和市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 20000, taxType: "税別", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "環境対策課 ごみ減量係" },
  { no: 42, ward: "清瀬市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 30000, taxType: "税別", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "環境課 ごみ減量推進係" },
  { no: 43, ward: "東久留米市", hasSubsidy: false, contactDepartment: "環境安全部 ごみ対策課" },
  { no: 44, ward: "武蔵村山市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 40000, taxType: "税別", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "ごみ対策課 減量推進係" },
  { no: 45, ward: "多摩市", hasSubsidy: false, contactDepartment: "環境部 ごみ対策課" },
  { no: 46, ward: "稲城市", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 10000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "生活環境課" },
  { no: 47, ward: "羽村市", hasSubsidy: false, contactDepartment: "環境保全課" },
  { no: 48, ward: "あきる野市", hasSubsidy: false, contactDepartment: "環境課" },
  { no: 49, ward: "西東京市", hasSubsidy: false, contactDepartment: "ごみ減量推進課" },
  { no: 50, ward: "瑞穂町", hasSubsidy: false, contactDepartment: "環境課" },
  { no: 51, ward: "日の出町", hasSubsidy: true, subsidyRate: "3/4", maxAmount: 20000, taxType: "税込", condition: "上限", applicationMethod: "購入前", storeDesignation: "指定なし", contactDepartment: "生活安全安心課" },
  { no: 52, ward: "檜原村", hasSubsidy: true, subsidyRate: "1/2", maxAmount: 30000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "産業環境課 生活環境係" },
  { no: 53, ward: "奥多摩町", hasSubsidy: true, subsidyRate: "2/3", maxAmount: 40000, taxType: "税込", condition: "上限", applicationMethod: "購入後", storeDesignation: "指定なし", contactDepartment: "環境整備課 環境係" },
  { no: 54, ward: "大島町", hasSubsidy: false, contactDepartment: "地域整備課" },
  { no: 55, ward: "利島村", hasSubsidy: false, contactDepartment: "産業環境課" },
  { no: 56, ward: "新島村", hasSubsidy: false, contactDepartment: "民生課" },
  { no: 57, ward: "神津島村", hasSubsidy: false, contactDepartment: "環境衛生課" },
  { no: 58, ward: "御蔵島村", hasSubsidy: false, contactDepartment: "務課総務係" },
  { no: 59, ward: "八丈町", hasSubsidy: false, contactDepartment: "住民課環境係" },
  { no: 60, ward: "青ヶ島村", hasSubsidy: false, contactDepartment: "務課" },
  { no: 61, ward: "小笠原村", hasSubsidy: false, contactDepartment: "建設水道課" },
  { no: 62, ward: "三宅村", hasSubsidy: false, contactDepartment: "地域整備課 環境整備係" }
];

export const subsidyDescription = `
生ごみ処理機購入助成金制度 【東京都 62】 2025年度
※助成金制度詳細については各自治体窓口で確認をお願いします。
`;
