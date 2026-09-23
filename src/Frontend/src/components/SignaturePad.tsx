import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Button, Typography } from '@mui/material';

interface SignaturePadProps {
  label: string;
  onChange: (signatureDataUrl: string) => void;
  value?: string;
  error?: boolean;
  helperText?: string;
}

export const SignaturePad = ({ label, onChange, value, error, helperText }: SignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (value && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(value);
    }
  }, []);

  const handleClear = () => {
    sigCanvas.current?.clear();
    onChange('');
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        onChange('');
      } else {
        try {
          const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
          onChange(dataUrl);
        } catch (e) {
          console.error("Signature capture failed:", e);
        }
      }
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color={error ? "error" : "text.secondary"} gutterBottom sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Box sx={{ 
        height: 120, 
        width: '100%',
        border: '2px solid', 
        borderColor: error ? 'error.main' : 'divider', 
        borderRadius: 4, 
        bgcolor: 'white',
        overflow: 'hidden',
        boxShadow: 1
      }}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{ style: { width: '100%', height: '100%' } }}
          onEnd={handleEnd}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button size="small" onClick={handleClear} sx={{ mt: 1, textTransform: 'none' }}>
          Clear Signature
        </Button>
        {helperText && (
          <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
            {helperText}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
