import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrecisionMeasurementScreen, MeasurementResults } from '@/components/PrecisionMeasurementScreen';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';

export const PrecisionMeasurementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthState();

  const handleMeasurementsComplete = async (results: MeasurementResults) => {
    try {
      if (!user?.opticId) {
        toast({
          title: "Error",
          description: "User profile not found",
          variant: "destructive"
        });
        return;
      }

      // Save measurements to database
      const { error } = await supabase
        .from('afericoes')
        .insert({
          usuario_id: user.id,
          optica_id: user.opticId,
          nome_cliente: 'Precision Measurement', // TODO: Get client name
          foto_url: 'precision_measurement.jpg', // TODO: Save image to storage
          dp_binocular: results.dnpMm,
          dnp_esquerda: results.dpLeftMm,
          dnp_direita: results.dpRightMm,
          altura_esquerda: results.heightLeftMm,
          altura_direita: results.heightRightMm,
          largura_armacao: results.dnpMm + 10, // Approximate frame width
          largura_lente: results.dnpMm / 2 // Approximate lens width
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Precision measurements saved successfully",
      });

      navigate('/measurement');
    } catch (error) {
      console.error('Error saving measurements:', error);
      toast({
        title: "Error",
        description: "Failed to save measurements",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate('/measurement');
  };

  return (
    <PrecisionMeasurementScreen
      onMeasurementsComplete={handleMeasurementsComplete}
      onCancel={handleCancel}
    />
  );
};