export type Product = {
  prescription_required: number;
  manufacturer: ReactI18NextChildren | Iterable<ReactI18NextChildren>;
  manufacturer: import("react/jsx-runtime").JSX.Element;
  category: string | number | undefined;
  product_uuid: string;
  name: string;
  price: number;
  gst_percent?: number;
  stock?: number;
  barcode?: string;
  sku?: string;
  image?: string;
};