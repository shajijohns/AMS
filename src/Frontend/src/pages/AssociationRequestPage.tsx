import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Box, Button, Container, TextField, Typography, Paper, 
  Stepper, Step, StepLabel, Grid, Divider, Alert,
  InputAdornment, MenuItem, FormControl, InputLabel, Select, Autocomplete,
  Snackbar, Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
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
  committeeMember1: committeeMemberSchema,
  committeeMember2: committeeMemberSchema,
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
  chairman: repSchema,
  secretary: repSchema,
  viceChairman: repSchema,
  boardMembers: z.array(repSchema),
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

type ApplicationFormData = z.infer<typeof fullSchema>;

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
    chairman: { name: '', street: '', city: '', state: '', zip: '', telephoneAndEmail: '' },
    secretary: { name: '', street: '', city: '', state: '', zip: '', telephoneAndEmail: '' },
    viceChairman: { name: '', street: '', city: '', state: '', zip: '', telephoneAndEmail: '' },
    boardMembers: [{ name: '', street: '', city: '', state: '', zip: '', telephoneAndEmail: '' }],
    pastPresident: { name: '', telephone: '', email: '' },
    pastSecretary: { name: '', telephone: '', email: '' },
    pastTreasurer: { name: '', telephone: '', email: '' }
  }
};

const GEOAPIFY_API_KEY = "6cca4ace5b7240cc93231a3c0a3889c4";

export const AssociationRequestPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [addressInputValue, setAddressInputValue] = useState('');


  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; type: string; path: string }[]>([]);
  const [docType, setDocType] = useState('Registration Certificate');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewFileUrl, setViewFileUrl] = useState<string | null>(null);

  const handleFileUpload = async () => {
    if (selectedFiles.length > 0 && docType) {
      for (const file of selectedFiles) {
        const formData = new window.FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/api/public/association-requests/upload', {
            method: 'POST',
            body: formData
          });
          if (response.ok) {
            const result = await response.json();
            setUploadedDocs(prev => [...prev, { name: file.name, type: docType, path: result.path }]);
          } else {
            alert(`Failed to upload ${file.name}`);
          }
        } catch (e) {
          console.error(e);
          alert(`Network error uploading ${file.name}`);
        }
      }
      setSelectedFiles([]);
    }
  };

  const [parentTenant, setParentTenant] = useState<{ id: string, legalName: string, displayName: string } | null>(null);

  useEffect(() => {
    const fetchParentTenant = async () => {
      try {
        const response = await fetch('/api/public/association-requests/parent-tenant');
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
      fetch(`/api/public/invitations/${inviteId}/click`, { method: 'PUT' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!addressInputValue || addressInputValue.length < 3) {
      setAddressOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(addressInputValue)}&apiKey=${GEOAPIFY_API_KEY}`);
        if (response.ok) {
          const data = await response.json();
          setAddressOptions(data.features || []);
        } else {
          setAddressOptions([]);
        }
      } catch (e) {
        setAddressOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [addressInputValue]);

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

  const { control, handleSubmit, trigger, watch, reset, getValues, setValue } = useForm<ApplicationFormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: getSavedDraft() as any
  });

  const { fields: boardMemberFields, append: appendBoardMember } = useFieldArray({
    control,
    name: "board.boardMembers"
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
      setSelectedFiles([]);
      setActiveStep(0);
    }
  };

  const handleClose = () => navigate('/');
  
  const buildPayload = (data: ApplicationFormData, isDraft: boolean) => {
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
        Chairman: data.board.chairman,
        Secretary: data.board.secretary,
        ViceChairman: data.board.viceChairman,
        BoardMembers: data.board.boardMembers,
        PastPresident: data.board.pastPresident,
        PastSecretary: data.board.pastSecretary,
        PastTreasurer: data.board.pastTreasurer
      },
      Documents: uploadedDocs.map(d => ({ name: d.name, type: d.type, path: d.path })),
      InviteId: localStorage.getItem('associationInviteId')
    };
  };

  const saveToDatabase = async (data: ApplicationFormData, isDraft: boolean) => {
    const payload = buildPayload(data, isDraft);
    const draftId = localStorage.getItem('associationDraftDbId');
    const url = draftId 
      ? `/api/public/association-requests/${draftId}`
      : '/api/public/association-requests';
    const method = draftId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 404 && method === 'PUT') {
        // Draft not found in DB (stale ID). Clear it and retry as POST.
        localStorage.removeItem('associationDraftDbId');
        return saveToDatabase(data, isDraft);
      }
      const errData = await response.json().catch(() => ({}));
      const errorMessage = errData.detail || errData.title || errData.message || 'An error occurred saving the form.';
      throw new Error(errorMessage);
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
      setSelectedFiles([]);
      setActiveStep(0);
      navigate('/');
    } catch (err: any) {
      console.error('Error saving draft', err);
      setError(err.message || 'Network error occurred. Draft is saved locally.');
      setSnackbarOpen(true);
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

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setError(null);
      await saveToDatabase(data, false);
      localStorage.removeItem('associationDraft');
      localStorage.removeItem('associationDraftDbId');
      reset(emptyFormState);
      setUploadedDocs([]);
      setSelectedFiles([]);
      setActiveStep(0);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting form', err);
      setError(err.message || 'Network error occurred.');
      setSnackbarOpen(true);
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

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={8000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%', fontSize: '1rem', boxShadow: 3 }}>
            {error}
          </Alert>
        </Snackbar>

        <form 
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        >
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
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.properties?.formatted || ''}
                    filterOptions={(x) => x} // Disable built-in filtering since we do server-side
                    value={field.value}
                    onChange={(_, newValue) => {
                      if (typeof newValue === 'string') {
                        field.onChange(newValue);
                      } else if (newValue && newValue.properties) {
                        const p = newValue.properties;
                        const streetAddress = p.address_line1 || '';
                        const city = p.city || p.county || '';
                        const state = p.state || '';
                        const zip = p.postcode || '';
                        const country = p.country || '';

                        if (streetAddress) {
                          field.onChange(streetAddress);
                        } else if (p.formatted) {
                          field.onChange(p.formatted);
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
              Please provide details for the Board of Directors, Past Office Bearers, and any Supporting Documents.
            </Alert>
            
            {renderRepresentative("board.chairman", "Chairman")}
            {renderRepresentative("board.secretary", "Secretary")}
            {renderRepresentative("board.viceChairman", "Vice Chairman")}
            
            {boardMemberFields.map((field, index) => (
               <Box key={field.id}>
                 {renderRepresentative(`board.boardMembers.${index}`, `Board Member ${index + 1}`)}
               </Box>
            ))}
            
            {boardMemberFields.length < 10 && (
               <Button variant="outlined" color="primary" onClick={() => appendBoardMember({ name: '', street: '', city: '', state: '', zip: '', telephoneAndEmail: '' })} sx={{ mb: 3 }}>
                 + Add More Board Member
               </Button>
            )}
            
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => setViewFileUrl(`/api/public/association-requests/document/${doc.path}`)}>View</Button>
                        <Button size="small" color="error" onClick={async () => {
                          try {
                            await fetch(`/api/public/association-requests/upload/${doc.path}`, { method: 'DELETE' });
                          } catch(e) {}
                          setUploadedDocs(docs => docs.filter((_, i) => i !== idx));
                        }} sx={{ alignSelf: 'flex-start' }}>Remove</Button>
                      </Box>
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
              <Button type="button" variant="outlined" component="label">
                Select Files
                <input type="file" hidden multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
                    
                    const validFiles = newFiles.filter(f => {
                      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
                      return allowedExtensions.includes(ext);
                    });

                    const existingNames = new Set([
                      ...selectedFiles.map(f => f.name),
                      ...uploadedDocs.map(d => d.name)
                    ]);
                    
                    const filteredNewFiles = validFiles.filter(f => !existingNames.has(f.name));
                    
                    let errorMessage = "";
                    if (validFiles.length < newFiles.length) {
                      errorMessage += "Only PDF, Word, and Excel files are allowed. ";
                    }
                    if (filteredNewFiles.length < validFiles.length) {
                      errorMessage += "Duplicate files were ignored.";
                    }
                    
                    if (errorMessage) {
                      setError(errorMessage.trim());
                      setSnackbarOpen(true);
                    }
                    
                    if (filteredNewFiles.length > 0) {
                      setSelectedFiles(prev => [...prev, ...filteredNewFiles]);
                    }
                    
                    e.target.value = '';
                  }
                }} />
              </Button>
              <Button 
                type="button"
                variant="contained" 
                onClick={handleFileUpload}
                disabled={selectedFiles.length === 0}
              >
                Upload
              </Button>
            </Box>
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Selected Files:</Typography>
                <Grid container spacing={1}>
                  {selectedFiles.map((file, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                      <Paper sx={{ p: 1, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                        <Typography variant="body2" noWrap sx={{ flex: 1, mr: 2 }} title={file.name}>{file.name}</Typography>
                        <Box sx={{ flexShrink: 0 }}>
                          <Button size="small" color="primary" onClick={() => setViewFileUrl(URL.createObjectURL(file))} sx={{ mr: 1 }}>
                            View
                          </Button>
                          <Button size="small" color="error" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}>
                            Remove
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Box>
              <Button type="button" onClick={handleClose} color="inherit" sx={{ mr: 1 }}>Close</Button>
              <Button type="button" onClick={handleClear} color="error" sx={{ mr: 1 }}>Clear</Button>
              <Button type="button" onClick={handleSaveAndClose} color="secondary" variant="outlined">Save & Close</Button>
            </Box>
            <Box>
              <Button type="button" disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ mr: 2 }}>
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button key="submit-btn" type="submit" variant="contained" color="primary">
                  Submit Application
                </Button>
              ) : (
                <Button key="next-btn" type="button" onClick={handleNext} variant="contained" color="primary">
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>

        <Dialog open={!!viewFileUrl} onClose={() => setViewFileUrl(null)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="h6">View Document</Typography>
            <IconButton onClick={() => setViewFileUrl(null)} edge="end"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ height: '80vh', p: 0 }}>
            {viewFileUrl && (
              <iframe src={viewFileUrl} width="100%" height="100%" style={{ border: 'none' }} title="Document Viewer" />
            )}
          </DialogContent>
        </Dialog>
      </Paper>
    </Container>
  );
};
