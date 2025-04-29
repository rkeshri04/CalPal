export interface BarcodeScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScanned: (barcode: string) => void;
}

export interface Tip {
    id: string;
    short: string;
    long: string;
}

export interface NutritionInfo {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
}

export type SearchProduct = {
    code: string; // Open Food Facts barcode
    product_name: string;
    brands?: string;
    image_url?: string;
    nutriments?: NutritionInfo;
};

export type TimeFrame = '1D' | '1W' | '1M' | 'All';
