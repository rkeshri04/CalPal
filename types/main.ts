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
export type SearchProduct = {
    id: number; // Spoonacular uses numeric IDs
    title: string;
    brand?: string;
    image?: string;
    upc?: string;
};

export type TimeFrame = '1D' | '1W' | '1M' | 'All';
