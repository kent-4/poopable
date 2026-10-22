import React, { useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../../components/ui';
import { colors } from '../../theme/tokens';
import { useRestroomExperience, useRestroomScope } from './context';
import type { Review, ReviewInput } from './types';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View>
      <AppText>{label}</AppText>
      <TextInput accessibilityLabel={label} style={styles.input} {...props} />
    </View>
  );
}
function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <AppText accessibilityRole="alert">{message}</AppText>
  ) : null;
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Could not submit. Please retry.';
}
function Ratings({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
  optional?: boolean;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="heading">
        {label}
        {optional ? ' (optional)' : ''}
      </AppText>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Button
            key={score}
            label={`${label} ${score} stars`}
            selected={score === value}
            variant={score === value ? 'primary' : 'secondary'}
            onPress={() => onChange(score)}
          />
        ))}
      </View>
      {optional && (
        <Button
          variant="secondary"
          label={`Clear ${label.toLowerCase()}`}
          onPress={() => onChange(undefined)}
        />
      )}
    </View>
  );
}
type ContributionProps = {
  restroomId: string;
  onBack(): void;
  onSuccess(): void;
  onAuthenticate(): void;
};
export function ReviewScreen(props: ContributionProps) {
  useRestroomScope(props.restroomId);
  const { visitor, snapshot, refreshing, error, refresh, snapshotVisitorId } =
    useRestroomExperience();
  const restroom = snapshot.restrooms.find(
    (item) => item.id === props.restroomId && item.state !== 'pending',
  );
  if (!visitor)
    return (
      <Frame>
        <AppText variant="title">Sign in to write a review</AppText>
        <Button label="Sign in" onPress={props.onAuthenticate} />
        <Button
          label="Back to restroom"
          variant="secondary"
          onPress={props.onBack}
        />
      </Frame>
    );
  if (snapshotVisitorId !== visitor.id)
    return (
      <Frame>
        <AppText accessibilityRole={error ? 'alert' : undefined}>
          {error ?? 'Loading your review…'}
        </AppText>
        {!refreshing && (
          <Button label="Retry your review" onPress={() => void refresh()} />
        )}
        <Button label="Back to restroom" onPress={props.onBack} />
      </Frame>
    );
  if (!restroom)
    return (
      <Frame>
        <AppText>
          {refreshing ? 'Loading restroom…' : (error ?? 'Restroom not found.')}
        </AppText>
        <Button label="Retry restroom" onPress={() => void refresh()} />
        <Button label="Back to restroom" onPress={props.onBack} />
      </Frame>
    );
  const existing = snapshot.reviews.find(
    (review) =>
      review.restroomId === restroom.id && review.authorId === visitor.id,
  );
  return (
    <ReviewForm
      key={`${restroom.id}:${visitor.id}`}
      {...props}
      name={restroom.name}
      existing={existing}
    />
  );
}
function ReviewForm({
  name,
  existing,
  ...props
}: ContributionProps & { name: string; existing?: Review }) {
  const { dependencies, refresh } = useRestroomExperience();
  const [input, setInput] = useState<Partial<ReviewInput>>(() =>
    existing
      ? {
          overall: existing.overall,
          cleanliness: existing.cleanliness,
          supplies: existing.supplies,
          facilityCondition: existing.facilityCondition,
          notes: existing.notes,
          desperateTimes: existing.desperateTimes,
        }
      : { desperateTimes: false },
  );
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const change = (patch: Partial<ReviewInput>) => {
    setInput((value) => ({ ...value, ...patch }));
    setDirty(true);
  };
  const back = React.useCallback(() => {
    if (dirty) setConfirm(true);
    else props.onBack();
  }, [dirty, props]);
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);
  async function save() {
    if (lock.current) return;
    if (!input.overall) {
      setError('Choose an overall experience from 1 to 5.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await dependencies.repository.saveReview(
        props.restroomId,
        input as ReviewInput,
      );
      setDirty(false);
      await refresh();
      props.onSuccess();
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Frame>
      <Button
        label="Back to restroom"
        variant="secondary"
        disabled={busy}
        onPress={back}
      />
      <AppText variant="title">
        {existing ? 'Edit review' : 'Rate this restroom'}
      </AppText>
      <AppText variant="heading">{name}</AppText>
      {(
        ['overall', 'cleanliness', 'supplies', 'facilityCondition'] as const
      ).map((key) => (
        <Ratings
          key={key}
          label={
            {
              overall: 'Overall experience',
              cleanliness: 'Cleanliness',
              supplies: 'Supplies',
              facilityCondition: 'Facility condition',
            }[key]
          }
          value={input[key]}
          optional={key !== 'overall'}
          onChange={(value) => change({ [key]: value })}
        />
      ))}
      <Field
        label="Written notes"
        value={input.notes ?? ''}
        onChangeText={(notes) => change({ notes })}
        multiline
        maxLength={2000}
      />
      <AppText>I would only use this restroom in desperate times</AppText>
      <Switch
        accessibilityLabel="I would only use this restroom in desperate times"
        value={input.desperateTimes === true}
        onValueChange={(desperateTimes) => change({ desperateTimes })}
      />
      <AppText>
        This assessment is independent of stars and whether the restroom is
        usable.
      </AppText>
      <ErrorMessage message={error} />
      <Button
        label={existing ? 'Save changes' : 'Submit review'}
        disabled={busy}
        onPress={() => void save()}
      />
      {confirm && (
        <View accessibilityViewIsModal style={styles.group}>
          <AppText variant="heading">Discard unsaved changes?</AppText>
          <Button label="Keep editing" onPress={() => setConfirm(false)} />
          <Button
            label="Discard changes"
            variant="secondary"
            onPress={props.onBack}
          />
        </View>
      )}
    </Frame>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  content: { padding: 20, gap: 18 },
  input: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    color: colors.primary,
  },
  group: { gap: 10 },
  stars: { gap: 8 },
});

let submissionSequence = 0;
export function ReportScreen(props: ContributionProps) {
  useRestroomScope(props.restroomId);
  const { visitor, dependencies, snapshot, refresh } = useRestroomExperience();
  const [attempted, setAttempted] = useState(false);
  const [condition, setCondition] = useState<
    'usable' | 'closed' | 'out-of-service'
  >();
  const [submissionId] = useState(
    () =>
      `${Date.now()}-${++submissionSequence}-${Math.random().toString(36).slice(2)}`,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    if (!condition) {
      setError('Choose a condition.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    setAttempted(true);
    try {
      await dependencies.repository.submitReport(
        props.restroomId,
        condition,
        submissionId,
      );
      await refresh();
      props.onSuccess();
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Frame>
      <Button
        label="Back to restroom"
        variant="secondary"
        disabled={busy}
        onPress={props.onBack}
      />
      <AppText variant="title">Report usability</AppText>
      <AppText>
        {snapshot.restrooms.find((item) => item.id === props.restroomId)?.name}
      </AppText>
      <AppText>
        Share what you observe now. The service records the observation time
        when submitted. A report is separate from your review.
      </AppText>
      {visitor ? (
        <>
          {(['usable', 'closed', 'out-of-service'] as const).map((state) => (
            <Button
              key={state}
              label={
                {
                  usable: 'Usable',
                  closed: 'Closed',
                  'out-of-service': 'Out of service',
                }[state]
              }
              disabled={busy || attempted}
              selected={condition === state}
              variant={condition === state ? 'primary' : 'secondary'}
              onPress={() => setCondition(state)}
            />
          ))}
          <ErrorMessage message={error} />
          <Button
            label="Submit observation"
            disabled={busy}
            onPress={() => void submit()}
          />
        </>
      ) : (
        <Button
          label="Sign in to report usability"
          onPress={props.onAuthenticate}
        />
      )}
    </Frame>
  );
}

export function AccountScreen({
  onBack,
  onAuthenticated,
}: {
  onBack(): void;
  onAuthenticated(): void;
}) {
  const { visitor, dependencies } = useRestroomExperience();
  const [mode, setMode] = useState<'signIn' | 'register' | 'recover'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email.');
      return;
    }
    if (mode !== 'recover' && !password) {
      setError('Enter your password.');
      return;
    }
    if (mode === 'register' && (!name.trim() || password.length < 6)) {
      setError('Enter a display name and a password of at least 6 characters.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (mode === 'recover') {
        await dependencies.auth.recover(email.trim());
        setNotice(
          dependencies.mode === 'demo'
            ? 'Demo mode does not send recovery email.'
            : 'If an account exists, recovery instructions have been sent.',
        );
      } else {
        if (mode === 'register')
          await dependencies.auth.register(email.trim(), password, name.trim());
        else await dependencies.auth.signIn(email.trim(), password);
        setPassword('');
        onAuthenticated();
      }
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Frame>
      <Button
        label="Back"
        variant="secondary"
        disabled={busy}
        onPress={onBack}
      />
      <AppText variant="title">Account</AppText>
      {visitor ? (
        <>
          <AppText>Signed in as {visitor.displayName}</AppText>
          <ErrorMessage message={error} />
          <Button
            label="Sign out"
            disabled={busy}
            onPress={() => {
              setBusy(true);
              void dependencies.auth
                .signOut()
                .catch((error) => setError(message(error)))
                .finally(() => setBusy(false));
            }}
          />
        </>
      ) : (
        <>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {mode !== 'recover' && (
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
            />
          )}
          {mode === 'register' && (
            <Field
              label="Display name"
              value={name}
              onChangeText={setName}
              maxLength={80}
            />
          )}
          <ErrorMessage message={error} />
          {notice ? (
            <AppText accessibilityRole="alert">{notice}</AppText>
          ) : null}
          <Button
            label={
              {
                signIn: 'Sign in',
                register: 'Register',
                recover: 'Send recovery instructions',
              }[mode]
            }
            disabled={busy}
            onPress={() => void submit()}
          />
          {mode !== 'register' && (
            <Button
              label="Create an account"
              variant="secondary"
              disabled={busy}
              onPress={() => setMode('register')}
            />
          )}
          {mode !== 'recover' && (
            <Button
              label="Forgot password"
              variant="secondary"
              disabled={busy}
              onPress={() => setMode('recover')}
            />
          )}
          {mode !== 'signIn' && (
            <Button
              label="Return to sign in"
              variant="secondary"
              disabled={busy}
              onPress={() => setMode('signIn')}
            />
          )}
        </>
      )}
    </Frame>
  );
}

export function FlagScreen({
  kind,
  contributionId,
  onBack,
  onSuccess,
  onAuthenticate,
}: {
  kind: 'review' | 'report';
  contributionId: string;
  onBack(): void;
  onSuccess(): void;
  onAuthenticate(): void;
}) {
  const { visitor, dependencies } = useRestroomExperience();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    if (!reason.trim()) {
      setError('Enter a reason for the owner.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await dependencies.repository.flagContribution(
        kind,
        contributionId,
        reason.trim(),
      );
      onSuccess();
    } catch (error) {
      setError(message(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Frame>
      <Button
        label="Back to restroom"
        disabled={busy}
        variant="secondary"
        onPress={onBack}
      />
      <AppText variant="title">Flag inappropriate {kind}</AppText>
      <AppText>
        Your reason is sent privately to the owner. Flagging does not
        automatically hide a contribution.
      </AppText>
      {visitor ? (
        <>
          <Field
            label="Reason for flag"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={2000}
          />
          <ErrorMessage message={error} />
          <Button
            label="Submit flag"
            disabled={busy}
            onPress={() => void submit()}
          />
        </>
      ) : (
        <Button label="Sign in to flag" onPress={onAuthenticate} />
      )}
    </Frame>
  );
}
