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
    code: string;
    product_name: string;
    brands?: string;
    image_front_url?: string;
};

export type TimeFrame = '1D' | '1W' | '1M' | 'All';
