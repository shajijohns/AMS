import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Box, Button, Container, TextField, Typography, Paper, 
  Stepper, Step, StepLabel, Grid, Divider, Alert,
  InputAdornment, MenuItem, FormControl, InputLabel, Select, Autocomplete
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SignaturePad } from '../components/SignaturePad';
import { usStates, flatCountries } from '../utils/geoData';

// Step 1 Schema
const orgSchema = z.object({
  associationName: z.string().min(2, "Name required"),
  address: z.string().min(2, "Address required"),
  city: z.string().min(2, "City required"),
  country: z.string().min(2, "Country required"),
  state: z.string().optional(), // Make state structurally optional to allow blank for non-USA, though form might enforce later
  zip: z.string().min(5, "Zip required"),
  telephone: z.string().min(10, "Phone required"),
  webAddress: z.string().optional(),
  numberOfPaidMembers: z.string().min(1, "Required"),
  yearFormed: z.string().min(4, "Required"),
  monthOfAnnualElection: z.string().optional(),
  regMonth: z.string().optional(),
  regDay: z.string().optional(),
  regYear: z.string().optional(),
  contactEmail: z.string().email("Valid email required"),
});

// Step 2 Schema
const committeeMemberSchema = z.object({
  name: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().optional(),
  signature: z.string().optional()
});

const requiredCommitteeMemberSchema = z.object({
  name: z.string().min(2, "Required"),
  telephone: z.string().min(10, "Required"),
  email: z.string().email("Required"),
  signature: z.string().min(10, "Required")
});

const execSchema = z.object({
  dateOfElection: z.string().optional(),
  dateOfTermEnding: z.string().optional(),
  president: requiredCommitteeMemberSchema,
  secretary: requiredCommitteeMemberSchema,
  treasurer: requiredCommitteeMemberSchema,
  committeeMember1: requiredCommitteeMemberSchema,
  committeeMember2: requiredCommitteeMemberSchema,
  committeeMember3: committeeMemberSchema,
  committeeMember4: committeeMemberSchema,
  committeeMember5: committeeMemberSchema,
});

// Step 3 Schema
const repSchema = z.object({
  name: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  telephoneAndEmail: z.string().optional(),
});

const pastBearerSchema = z.object({
  name: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().optional(),
});

const boardSchema = z.object({
  currentPresident: repSchema,
  pastPresident: pastBearerSchema,
  pastSecretary: pastBearerSchema,
  pastTreasurer: pastBearerSchema
});

// Combined Schema
const fullSchema = z.object({
  org: orgSchema,
  exec: execSchema,
  board: boardSchema
});

type FormData = z.infer<typeof fullSchema>;

const steps = ['Organization Details', 'Executive Committee', 'Board & Documents'];

const emptyFormState = {
  org: {
    associationName: '', address: '', city: '', country: 'United States', state: '', zip: '', telephone: '',
    webAddress: '', numberOfPaidMembers: '', yearFormed: '',
    monthOfAnnualElection: '', regMonth: '', regDay: '', regYear: '', contactEmail: ''
  },
  exec: {
    dateOfElection: '', dateOfTermEnding: '',
    president: { name: '', telephone: '', email: '', signature: '' },
    secretary: { name: '', telephone: '', email: '', signature: '' },
    treasurer: { name: '', telephone: '', email: '', signature: '' },
    committeeMember1: { name: '', telephone: '', email: '', signature: '' },
    committeeMember2: { name: '', telephone: '', email: '', signature: '' },
    committeeMember3: { name: '', telephone: '', email: '', signature: '' },
    committeeMember4: { name: '', telephone: '', email: '', signature: '' },
    committeeMember5: { name: '', telephone: '', email: '', signature: '' },
  },
  board: {
    currentPresident: { name: '', street: '', city: '', state: '', zip: '', telephoneAndEmail: '' },
    pastPresident: { name: '', telephone: '', email: '' },
    pastSecretary: { name: '', telephone: '', email: '' },
    pastTreasurer: { name: '', telephone: '', email: '' }
  }
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBAmIfMdRKKpctLdYdi7EZyK0GlSnkJ2hs";

const loadGoogleMapsScript = (callback: () => void) => {
  if (typeof (window as any).google === 'object' && typeof (window as any).google.maps === 'object') {
    callback();
    return;
  }
  const existingScript = document.getElementById('googleMapsScript');
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.id = 'googleMapsScript';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      if (callback) callback();
    };
  } else {
    existingScript.addEventListener('load', () => {
      if (callback) callback();
    });
  }
};

export const AssociationRequestPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [addressInputValue, setAddressInputValue] = useState('');
  const [autocompleteService, setAutocompleteService] = useState<any>(null);
  const [geocoderService, setGeocoderService] = useState<any>(null);

  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; type: string; file: File }[]>([]);
  const [docType, setDocType] = useState('Registration Certificate');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileUpload = () => {
    if (selectedFiles && docType) {
      const newDocs = Array.from(selectedFiles).map(file => ({
        name: file.name,
        type: docType,
        file: file
      }));
      setUploadedDocs(prev => [...prev, ...newDocs]);
      setSelectedFiles(null);
    }
  };

  const [parentTenant, setParentTenant] = useState<{ id: string, legalName: string, displayName: string } | null>(null);

  useEffect(() => {
    const fetchParentTenant = async () => {
      try {
        const response = await fetch('http://localhost:5200/api/public/association-requests/parent-tenant');
        if (response.ok) {
          const data = await response.json();
          setParentTenant(data);
        }
      } catch (e) {
        console.error("Failed to fetch parent tenant", e);
      }
    };
    fetchParentTenant();
    
    // Check for inviteId
    const queryParams = new URLSearchParams(window.location.search);
    const inviteId = queryParams.get('inviteId');
    if (inviteId) {
      localStorage.setItem('associationInviteId', inviteId);
      // Fire and forget click tracking
      fetch(`http://localhost:5200/api/public/invitations/${inviteId}/click`, { method: 'PUT' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      setAutocompleteService(new (window as any).google.maps.places.AutocompleteService());
      setGeocoderService(new (window as any).google.maps.Geocoder());
    });
  }, []);

  useEffect(() => {
    if (!addressInputValue || addressInputValue.length < 3 || !autocompleteService) {
      setAddressOptions([]);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteService.getPlacePredictions({ input: addressInputValue }, (predictions: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
          setAddressOptions(predictions);
        } else {
          setAddressOptions([]);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [addressInputValue, autocompleteService]);

  const getSavedDraft = () => {
    try {
      const saved = localStorage.getItem('associationDraft');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...emptyFormState, ...parsed };
        if (parsed.org) {
          merged.org = { ...emptyFormState.org, ...parsed.org };
        }
        if (parsed.exec) {
          merged.exec = { ...emptyFormState.exec, ...parsed.exec };
        }
        if (parsed.board) {
          merged.board = { ...emptyFormState.board, ...parsed.board };
        }
        if (merged.org && !merged.org.country) {
          merged.org.country = 'United States';
        }
        return merged;
      }
    } catch(e) {}
    return emptyFormState;
  }

  const { control, handleSubmit, trigger, watch, reset, getValues, setValue } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: getSavedDraft()
  });

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('associationDraft', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all form data?")) {
      localStorage.removeItem('associationDraft');
      reset(emptyFormState);
      setUploadedDocs([]);
      setSelectedFiles(null);
      setActiveStep(0);
    }
  };

  const handleClose = () => navigate('/');
  
  const buildPayload = (data: FormData, isDraft: boolean) => {
    return {
      IsDraft: isDraft,
      ParentTenantId: parentTenant?.id,
      AssociationName: data.org.associationName,
      Address: data.org.address,
      City: data.org.city,
      Country: data.org.country,
      State: data.org.state || '',
      Zip: data.org.zip,
      Telephone: data.org.telephone,
      WebAddress: data.org.webAddress,
      NumberOfPaidMembers: data.org.numberOfPaidMembers ? parseInt(data.org.numberOfPaidMembers, 10) : null,
      YearFormed: data.org.yearFormed ? parseInt(data.org.yearFormed, 10) : null,
      MonthOfAnnualElection: data.org.monthOfAnnualElection,
      DateOfStateRegistration: (data.org.regYear && data.org.regMonth && data.org.regDay) ? new Date(`${data.org.regYear}-${data.org.regMonth}-${data.org.regDay}`).toISOString() : null,
      ContactEmail: data.org.contactEmail,
      Type: 0,
      StateOfIncorporation: data.org.state,
      ContactName: data.exec.president.name || '',
      ContactPhone: data.org.telephone,
      
      ExecutiveCommittee: {
        DateOfElection: data.exec.dateOfElection ? new Date(data.exec.dateOfElection).toISOString() : null,
        DateOfTermEnding: data.exec.dateOfTermEnding ? new Date(data.exec.dateOfTermEnding).toISOString() : null,
        President: data.exec.president,
        Secretary: data.exec.secretary,
        Treasurer: data.exec.treasurer,
        CommitteeMember1: data.exec.committeeMember1,
        CommitteeMember2: data.exec.committeeMember2,
        CommitteeMember3: data.exec.committeeMember3,
        CommitteeMember4: data.exec.committeeMember4,
        CommitteeMember5: data.exec.committeeMember5,
      },
      
      BoardOfDirectors: {
        CurrentPresident: data.board.currentPresident,
        PastPresident: data.board.pastPresident,
        PastSecretary: data.board.pastSecretary,
        PastTreasurer: data.board.pastTreasurer
      },
      InviteId: localStorage.getItem('associationInviteId')
    };
  };

  const saveToDatabase = async (data: FormData, isDraft: boolean) => {
    const payload = buildPayload(data, isDraft);
    const draftId = localStorage.getItem('associationDraftDbId');
    const url = draftId 
      ? `http://localhost:5200/api/public/association-requests/${draftId}`
      : 'http://localhost:5200/api/public/association-requests';
    const method = draftId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'An error occurred saving the form.');
    }

    const responseData = await response.json();
    if (responseData.requestId) {
      localStorage.setItem('associationDraftDbId', responseData.requestId);
    }
  };

  const handleSaveAndClose = async () => {
    try {
      await saveToDatabase(getValues(), true);
      alert("Draft saved to database successfully!");
      reset(emptyFormState);
      setUploadedDocs([]);
      setSelectedFiles(null);
      setActiveStep(0);
      navigate('/');
    } catch (err: any) {
      console.error('Error saving draft', err);
      alert(err.message || 'Network error occurred. Draft is saved locally.');
      navigate('/');
    }
  };

  const handleNext = async () => {
    let isValid = false;
    if (activeStep === 0) isValid = await trigger('org');
    if (activeStep === 1) isValid = await trigger('exec');
    
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await saveToDatabase(data, false);
      localStorage.removeItem('associationDraft');
      localStorage.removeItem('associationDraftDbId');
      reset(emptyFormState);
      setUploadedDocs([]);
      setSelectedFiles(null);
      setActiveStep(0);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting form', err);
      setError(err.message || 'Network error occurred.');
    }
  };

  const renderCommitteeMember = (path: string, label: string) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>{label}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Controller name={`${path}.name` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Name" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Controller name={`${path}.telephone` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Telephone" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.email` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Email" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Controller name={`${path}.signature` as any} control={control} render={({ field, fieldState }: any) => (
            <SignaturePad label="Signature" onChange={field.onChange} value={field.value} error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
      </Grid>
    </Box>
  );

  const renderRepresentative = (path: string, label: string) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>{label}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.name` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Name" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Controller name={`${path}.street` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Street / PO Box" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.city` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="City" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Controller name={`${path}.state` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="State" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <Controller name={`${path}.zip` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Zip" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.telephoneAndEmail` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Telephone & Email" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
      </Grid>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );

  const renderPastBearer = (path: string, label: string) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>{label}</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.name` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Name" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.telephone` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Telephone" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Controller name={`${path}.email` as any} control={control} render={({ field, fieldState }: any) => (
            <TextField {...field} label="Email" fullWidth size="small" error={fieldState.invalid} helperText={fieldState.error?.message} />
          )} />
        </Grid>
      </Grid>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );

  const renderField = (name: string, label: string, required: boolean = true, xsWidth: number = 12, mdWidth: number = 12, type: string = "text") => (
    <Grid size={{ xs: xsWidth, md: mdWidth }}>
      <Controller name={name as any} control={control} render={({ field, fieldState }: any) => (
        <TextField 
          {...field} 
          required={required}
          type={type}
          label={label} 
          fullWidth 
          error={fieldState.invalid} 
          helperText={fieldState.error?.message} 
          InputLabelProps={type === 'date' ? { shrink: true } : undefined}
          InputProps={{
            endAdornment: (!fieldState.invalid && field.value) ? (
              <InputAdornment position="end"><CheckCircleIcon color="success" /></InputAdornment>
            ) : null
          }}
        />
      )} />
    </Grid>
  );

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="h4" color="primary" gutterBottom>Application Submitted!</Typography>
        <Typography variant="body1">
          Your association registration request has been received. Our Membership Committee will review the application. 
          You will receive an update via email shortly.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, background: 'background.paper' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.light', textAlign: 'center' }}>
          Application for Membership
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          {parentTenant ? parentTenant.legalName : 'Loading...'}
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1 */}
          {activeStep === 0 && (
          <Box>
            <Grid container spacing={3}>
              {renderField("org.associationName", "1. Name of Organization", true, 12, 12)}
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller name="org.address" control={control} render={({ field, fieldState }: any) => (
                  <Autocomplete
                    freeSolo
                    options={addressOptions}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.description}
                    filterOptions={(x) => x} // Disable built-in filtering since we do server-side
                    value={field.value}
                    onChange={(_, newValue) => {
                      if (typeof newValue === 'string') {
                        field.onChange(newValue);
                      } else if (newValue && newValue.description) {
                        field.onChange(newValue.description);
                        
                        if (geocoderService && newValue.place_id) {
                          geocoderService.geocode({ placeId: newValue.place_id }, (results: any, status: any) => {
                            if (status === 'OK' && results[0]) {
                              const addressComponents = results[0].address_components;
                              let streetNumber = '';
                              let route = '';
                              let city = '';
                              let state = '';
                              let zip = '';
                              let country = '';

                              for (const component of addressComponents) {
                                const types = component.types;
                                if (types.includes('street_number')) streetNumber = component.long_name;
                                if (types.includes('route')) route = component.long_name;
                                if (types.includes('locality') || types.includes('postal_town') || types.includes('sublocality_level_1')) city = component.long_name;
                                if (types.includes('administrative_area_level_1')) state = component.long_name;
                                if (types.includes('postal_code')) zip = component.long_name;
                                if (types.includes('country')) country = component.long_name;
                              }

                              const streetAddress = `${streetNumber} ${route}`.trim();
                              if (streetAddress) {
                                field.onChange(streetAddress);
                              }

                              if (city) setValue('org.city', city, { shouldValidate: true, shouldDirty: true });
                              if (state) setValue('org.state', state, { shouldValidate: true, shouldDirty: true });
                              if (zip) setValue('org.zip', zip, { shouldValidate: true, shouldDirty: true });
                              if (country) {
                                 const matchedCountry = flatCountries.find(c => c.name.toLowerCase() === country.toLowerCase() || c.code.toLowerCase() === country.toLowerCase());
                                 if (matchedCountry) {
                                   setValue('org.country', matchedCountry.name, { shouldValidate: true, shouldDirty: true });
                                 }
                              }
                            }
                          });
                        }
                      } else {
                        field.onChange('');
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      setAddressInputValue(newInputValue);
                      if (event && event.type === 'change') {
                         field.onChange(newInputValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="2. Address (Street / PO Box)"
                        fullWidth
                        error={fieldState.invalid}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )} />
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <Controller name="org.country" control={control} render={({ field, fieldState }: any) => (
                  <Autocomplete
                    options={flatCountries}
                    groupBy={(option) => option.continent}
                    getOptionLabel={(option) => option.code === 'US' ? 'US - United States' : option.name}
                    value={flatCountries.find(c => c.name === field.value) || null}
                    onChange={(_, newValue) => field.onChange(newValue ? newValue.name : '')}
                    renderOption={(props, option) => (
                      <Box component="li" sx={{ '& > span': { mr: 2, flexShrink: 0 } }} {...props}>
                        <span style={{ fontSize: '1.2rem' }}>{option.flag}</span>
                        {option.code === 'US' ? 'US - United States' : option.name}
                      </Box>
                    )}
                    renderInput={(params) => {
                      const selectedOption = flatCountries.find(c => c.name === field.value);
                      return (
                        <TextField
                          {...params}
                          required
                          label="Country"
                          error={fieldState.invalid}
                          helperText={fieldState.error?.message}
                          slotProps={{
                            ...params.slotProps,
                            input: {
                              ...params.slotProps?.input,
                              startAdornment: (
                                <React.Fragment>
                                  {selectedOption && (
                                    <InputAdornment position="start" sx={{ pl: 1 }}>
                                      <span style={{ fontSize: '1.2rem' }}>{selectedOption.flag}</span>
                                    </InputAdornment>
                                  )}
                                  {params.slotProps?.input?.startAdornment}
                                </React.Fragment>
                              ),
                            }
                          }}
                        />
                      );
                    }}
                  />
                )} />
              </Grid>

              {renderField("org.city", "City", true, 6, 2)}

              <Grid size={{ xs: 6, md: 2 }}>
                <Controller name="org.state" control={control} render={({ field, fieldState }: any) => (
                  watch('org.country') === 'United States' ? (
                    <TextField
                      {...field}
                      select
                      required
                      label="State"
                      fullWidth
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                    >
                      {usStates.map(state => <MenuItem key={state} value={state}>{state}</MenuItem>)}
                    </TextField>
                  ) : (
                    <TextField
                      {...field}
                      label="State"
                      fullWidth
                      error={fieldState.invalid}
                      helperText={fieldState.error?.message}
                    />
                  )
                )} />
              </Grid>

              {renderField("org.zip", "Zip", true, 6, 1)}
              {renderField("org.telephone", "Tel. #", true, 12, 6)}
              {renderField("org.webAddress", "3. Web Address", false, 12, 6)}
              {renderField("org.numberOfPaidMembers", "4. Number of Paid Members", true, 12, 3, "number")}
              <Grid size={{ xs: 12, md: 3 }}>
                <Controller name="org.yearFormed" control={control} render={({ field, fieldState }: any) => (
                  <TextField 
                    {...field} 
                    select
                    required
                    label="5. Year Organization Formed" 
                    fullWidth 
                    error={fieldState.invalid} 
                    helperText={fieldState.error?.message} 
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {Array.from({length: 100}, (_, i) => String(new Date().getFullYear() - i)).map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap', height: '100%', pt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ minWidth: 150 }}>
                    6. Date of State Registration
                  </Typography>
                  <Controller name="org.regMonth" control={control} render={({ field }: any) => (
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Month</InputLabel>
                      <Select {...field} label="Month">
                        <MenuItem value=""><em>None</em></MenuItem>
                        {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
                  <Controller name="org.regDay" control={control} render={({ field }: any) => (
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Day</InputLabel>
                      <Select {...field} label="Day">
                        <MenuItem value=""><em>None</em></MenuItem>
                        {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
                  <Controller name="org.regYear" control={control} render={({ field }: any) => (
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Year</InputLabel>
                      <Select {...field} label="Year">
                        <MenuItem value=""><em>None</em></MenuItem>
                        {Array.from({length: 100}, (_, i) => String(new Date().getFullYear() - i)).map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>7. Election Details</Typography>
                <Grid container spacing={2}>
                  {renderField("exec.dateOfElection", "Date of Election", false, 12, 4, "date")}
                  {renderField("exec.dateOfTermEnding", "Date of Term Ending", false, 12, 4, "date")}
                  {renderField("org.contactEmail", "8. Primary contact details", true, 12, 4)}
                </Grid>
              </Grid>


            </Grid>
          </Box>
          )}

          {/* Step 2 */}
          {activeStep === 1 && (
          <Box>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 3 }}>9. Details of Current Executive Committee</Typography>
            
            {renderCommitteeMember("exec.president", "1. President")}
            {renderCommitteeMember("exec.secretary", "2. Secretary")}
            {renderCommitteeMember("exec.treasurer", "3. Treasurer")}
            {renderCommitteeMember("exec.committeeMember1", "4. Committee Member 1")}
            {renderCommitteeMember("exec.committeeMember2", "5. Committee Member 2")}
            {renderCommitteeMember("exec.committeeMember3", "6. Committee Member 3")}
            {renderCommitteeMember("exec.committeeMember4", "7. Committee Member 4")}
            {renderCommitteeMember("exec.committeeMember5", "8. Committee Member 5")}
          </Box>
          )}

          {/* Step 3 */}
          {activeStep === 2 && (
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>List of Board of Directors and Documents</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please provide details for the Current President, Past Office Bearers, and any Supporting Documents.
            </Alert>
            
            {renderRepresentative("board.currentPresident", "Current President - Board of Directors")}
            
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4, mb: 3 }}>Last Office Bearers</Typography>
            {renderPastBearer("board.pastPresident", "Past President")}
            {renderPastBearer("board.pastSecretary", "Past Secretary")}
            {renderPastBearer("board.pastTreasurer", "Past Treasurer")}
            
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 4 }}>Supporting Documents</Typography>
            
            {uploadedDocs.length > 0 && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {uploadedDocs.map((doc, idx) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" noWrap title={doc.name}>{doc.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{doc.type}</Typography>
                      <Button size="small" color="error" onClick={() => setUploadedDocs(docs => docs.filter((_, i) => i !== idx))} sx={{ alignSelf: 'flex-start' }}>Remove</Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={docType}
                  label="Document Type"
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <MenuItem value="Registration Certificate">Registration Certificate</MenuItem>
                  <MenuItem value="Bylaws">Bylaws</MenuItem>
                  <MenuItem value="Tax Exemption">Tax Exemption</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" component="label">
                Select Files
                <input type="file" hidden multiple onChange={(e) => setSelectedFiles(e.target.files)} />
              </Button>
              <Button 
                variant="contained" 
                onClick={handleFileUpload}
                disabled={!selectedFiles || selectedFiles.length === 0}
              >
                Upload
              </Button>
            </Box>
            {selectedFiles && selectedFiles.length > 0 && (
              <Typography variant="body2" sx={{ mb: 3 }}>
                {selectedFiles.length} file(s) selected
              </Typography>
            )}
          </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Box>
              <Button onClick={handleClose} color="inherit" sx={{ mr: 1 }}>Close</Button>
              <Button onClick={handleClear} color="error" sx={{ mr: 1 }}>Clear</Button>
              <Button onClick={handleSaveAndClose} color="secondary" variant="outlined">Save & Close</Button>
            </Box>
            <Box>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ mr: 2 }}>
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button type="submit" variant="contained" color="primary">
                  Submit Application
                </Button>
              ) : (
                <Button onClick={handleNext} variant="contained" color="primary">
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};
