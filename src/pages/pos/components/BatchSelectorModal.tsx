// src/pos/components/BatchSelectorModal.tsx

import { IonModal, IonButton, IonContent, IonList, IonItem, IonLabel, IonText } from '@ionic/react';

interface BatchInfo {
  batch_uuid: string;
  batch_number: string;
  expiry_date: string;
  selling_price: number;
  mrp: number;
  quantity: number;
  sold_quantity: number;
  available_quantity: number;
}

interface BatchSelectorModalProps {
  isOpen: boolean;
  batches: BatchInfo[];
  productName: string;
  onClose: () => void;
  onSelect: (batch: BatchInfo) => void;
}

export default function BatchSelectorModal({
  isOpen,
  batches,
  productName,
  onClose,
  onSelect
}: BatchSelectorModalProps) {
  const getAvailableQuantity = (batch: BatchInfo) => {
    return batch.available_quantity || (batch.quantity - (batch.sold_quantity || 0));
  };

  const isExpiringSoon = (expiryDate: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Select Batch</h2>
        <p className="text-gray-600 mb-4">{productName}</p>
        
        <IonContent className="ion-padding">
          <IonList>
            {batches.map((batch) => {
              const available = getAvailableQuantity(batch);
              const isExpiring = isExpiringSoon(batch.expiry_date);
              
              return (
                <IonItem
                  key={batch.batch_uuid}
                  button
                  onClick={() => onSelect(batch)}
                  className="mb-2"
                >
                  <div className="flex flex-col w-full py-2">
                    <div className="flex justify-between items-center">
                      <IonLabel>
                        <strong>Batch: {batch.batch_number}</strong>
                      </IonLabel>
                      <IonText color={isExpiring ? 'warning' : 'success'}>
                        <small>
                          Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                        </small>
                      </IonText>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm">
                        Available: {available} units
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        ₹{batch.selling_price}
                      </span>
                    </div>
                    {isExpiring && (
                      <div className="text-xs text-orange-500 mt-1">
                        ⚠️ Expires soon
                      </div>
                    )}
                  </div>
                </IonItem>
              );
            })}
          </IonList>
        </IonContent>
        
        <div className="flex gap-2 mt-4">
          <IonButton expand="block" fill="outline" onClick={onClose}>
            Cancel
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
}