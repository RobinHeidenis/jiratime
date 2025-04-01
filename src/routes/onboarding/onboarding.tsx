import {
  ConfirmInput,
  PasswordInput,
  Select,
  Spinner,
  TextInput,
} from "@inkjs/ui";
import { useMutation } from "@tanstack/react-query";
import { Box, Text, useFocusManager, useInput } from "ink";
import { useEffect, useState } from "react";
import { useBoardsQuery } from "../../api/get-boards.query.js";
import { useCustomFieldsQuery } from "../../api/get-custom-fields.query.js";
import { type JiraProfile, useMeQuery } from "../../api/get-me.query.js";
import type { ApiRequester } from "../../api/request.js";
import { Focusable } from "../../components/focusable.js";
import { env } from "../../env.js";
import { useRequester } from "../../hooks/use-requester.js";
import { APP_NAME } from "../../lib/constants.js";
import { asNonNullable } from "../../lib/utils/as-non-nullable.js";
import {
  CUSTOM_FIELDS,
  type CustomFields,
  type OnboardingData,
  finishOnboarding,
} from "./finish-onboarding.js";
import { SelectCustomField } from "./select-custom-field.js";

const OnboardingStep = {
  Welcome: "Welcome",
  JiraUrl: "JiraUrl",
  Credentials: "Credentials",
  ConfirmCredentials: "ConfirmCredentials",
  BoardSelection: "BoardSelection",
  CustomFieldSelection: "CustomFieldSelection",
  Finish: "Finish",
} as const;

type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

const ifDev = (key: keyof typeof env) => {
  if (process.env.NODE_ENV === "development") {
    return env[key];
  }
};

const useStepper = () => {
  const [stepIndex, setStepIndex] = useState(0);

  const STEPS = Object.values(OnboardingStep);

  const next = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const prev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const step = STEPS[stepIndex]!;

  return { step, next, prev };
};

export const Onboarding = () => {
  const [form, setForm] = useState({
    jiraUrl: ifDev("JIRA_BASE_URL") as URL | null,
    base64Token: ifDev("JIRA_API_KEY") as string,
    boardId: ifDev("JIRA_BOARD_ID") as string,
    customFields: {} as Record<keyof CustomFields, string | null>,
  });

  const [profile, setProfile] = useState<JiraProfile | null>(null);

  const requester = useRequester(form.jiraUrl, form.base64Token);

  const { step, next, prev } = useStepper();

  const Step = {
    [OnboardingStep.Welcome]: () => <WelcomeStep onNext={next} />,
    [OnboardingStep.JiraUrl]: () => (
      <JiraUrlStep
        initialValue={form.jiraUrl}
        onSubmit={(jiraUrl) => {
          setForm((prev) => ({ ...prev, jiraUrl }));
          next();
        }}
      />
    ),
    [OnboardingStep.Credentials]: () => {
      const decodedToken = form.base64Token
        ? Buffer.from(form.base64Token, "base64").toString("utf8")
        : null;

      const [email, apiToken] = decodedToken?.split(":") ?? [];

      return (
        <CredentialsStep
          email={email}
          apiToken={apiToken}
          onSubmit={({ email, apiToken }) => {
            const base64Token = Buffer.from(`${email}:${apiToken}`).toString(
              "base64",
            );

            setForm((prev) => ({ ...prev, email, base64Token }));

            next();
          }}
        />
      );
    },
    [OnboardingStep.ConfirmCredentials]: () => (
      <CredentialConfirmStep
        request={requester!}
        onConfirm={(profile) => {
          setProfile(profile);

          next();
        }}
        onCancel={prev}
      />
    ),
    [OnboardingStep.BoardSelection]: () => (
      <BoardSelectionStep
        request={requester!}
        onSubmit={(boardId) => {
          setForm((prev) => ({ ...prev, boardId }));

          next();
        }}
      />
    ),
    [OnboardingStep.CustomFieldSelection]: () => (
      <CustomFieldSelectionStep<CustomFields>
        request={requester!}
        fieldNames={CUSTOM_FIELDS}
        onSubmit={(customFields) => {
          setForm((prev) => ({
            ...prev,
            customFields,
          }));

          next();
        }}
      />
    ),
    [OnboardingStep.Finish]: () => (
      <FinishStep
        data={asNonNullable({
          jiraUrl: form.jiraUrl,
          apiToken: form.base64Token,
          boardId: form.boardId,
          profile,
          customFields: form.customFields,
        })}
      />
    ),
  }[step];

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      flexDirection="column"
    >
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        borderColor="blue"
        borderStyle="round"
        padding={1}
        gap={2}
      >
        {step !== OnboardingStep.Finish && <Text>Welcome to {APP_NAME}</Text>}

        <Step />
      </Box>
    </Box>
  );
};

const WelcomeStep = ({ onNext }: { onNext: () => void }) => {
  useInput((_input, key) => {
    if (key.return) {
      onNext();
    }
  });

  return (
    <Box flexGrow={1} flexDirection="column" gap={2}>
      <Text>
        This is a terminal-based Jira client. To get started, you need to
        provide a few details
      </Text>

      <Box justifyContent="center">
        <Text color="blue">Press {"<return>"} to continue</Text>
      </Box>
    </Box>
  );
};

const JiraUrlStep = ({
  initialValue,
  onSubmit,
}: { initialValue?: URL | null; onSubmit: (jiraUrl: URL) => void }) => {
  const [invalidUrl, setInvalidUrl] = useState(false);

  return (
    <Box flexGrow={1} flexDirection="column" gap={2} width="100%">
      <Text>Enter your Jira URL</Text>

      <Box borderStyle="round" borderColor="blue">
        <TextInput
          defaultValue={initialValue?.toString()}
          placeholder="acme.atlassian.net"
          onSubmit={(url) => {
            setInvalidUrl(false);

            let parsedUrl: URL;
            try {
              parsedUrl = new URL(
                url.startsWith("https://") ? url : `https://${url}`,
              );
            } catch {
              setInvalidUrl(true);
              return;
            }

            onSubmit(parsedUrl);
          }}
        />
      </Box>
      {invalidUrl && <Text color="red">Invalid URL</Text>}
    </Box>
  );
};

const CredentialsStep = ({
  onSubmit,
  email: initialEmail,
  apiToken: initialToken,
}: {
  email?: string;
  apiToken?: string;
  onSubmit: (args: { email: string; apiToken: string }) => void;
}) => {
  const { focus } = useFocusManager();

  useEffect(() => {
    focus("email");
  }, [focus]);

  const [errorMessage, setErrorMessage] = useState("");

  // Track both in state, since we can't handle one onSubmit of both
  const [email, setEmail] = useState(initialEmail ?? "");
  const [apiToken, setApiToken] = useState(initialToken ?? "");

  useInput((_, key) => {
    if (!key.return) {
      return;
    }

    if (email && apiToken) {
      onSubmit({ email, apiToken });
    } else {
      setErrorMessage("Please fill in both fields");
    }
  });

  return (
    <Box flexGrow={1} flexDirection="column" gap={2}>
      <Text>Enter your Jira credentials</Text>

      <Box flexDirection="column" gap={1}>
        <Box borderStyle="round" borderColor="blue">
          <Focusable
            id="email"
            render={({ isFocused }) => (
              <TextInput
                defaultValue={initialEmail}
                isDisabled={!isFocused}
                placeholder="Email"
                onChange={setEmail}
              />
            )}
          />
        </Box>

        <Box borderStyle="round" borderColor="blue">
          <Focusable
            id="apiToken"
            render={({ isFocused }) => (
              <PasswordInput
                isDisabled={!isFocused}
                placeholder="API token"
                onChange={setApiToken}
              />
            )}
          />
        </Box>
      </Box>

      {errorMessage && <Text color="red">{errorMessage}</Text>}
    </Box>
  );
};

const CredentialConfirmStep = ({
  request,
  onConfirm,
  onCancel,
}: {
  request: ApiRequester;
  onConfirm: (profile: JiraProfile) => void;
  onCancel: () => void;
}) => {
  const { isLoading, data: user } = useMeQuery(request);

  return (
    <Box flexGrow={1} flexDirection="column" gap={2}>
      <Text>Confirm your credentials</Text>

      {isLoading || !user ? (
        <Spinner />
      ) : (
        <Box flexDirection="column" gap={1}>
          <Text>Display name: {user.displayName}</Text>
        </Box>
      )}

      {!!user && (
        <Box gap={2}>
          <Text>Is this you?</Text>
          <ConfirmInput onConfirm={() => onConfirm(user)} onCancel={onCancel} />
        </Box>
      )}
    </Box>
  );
};

const BoardSelectionStep = ({
  request,
  onSubmit,
}: {
  request: ApiRequester;
  onSubmit: (boardId: string) => void;
}) => {
  const { isLoading, data: boards } = useBoardsQuery(request);

  return (
    <Box flexGrow={1} flexDirection="column" gap={2}>
      <Text>Select a board</Text>

      {isLoading || !boards?.length ? (
        <Spinner />
      ) : (
        <Select
          onChange={(boardId) => onSubmit(boardId)}
          options={boards.map((board) => ({
            label: board.displayName,
            value: board.id,
          }))}
        />
      )}
    </Box>
  );
};

const CustomFieldSelectionStep = <T extends Record<string, string | null>>({
  request,
  onSubmit,
  fieldNames,
}: {
  request: ApiRequester;
  fieldNames: Record<keyof T, string>;
  onSubmit: (customFields: T) => void;
}) => {
  const { isLoading, data: fields } = useCustomFieldsQuery(request);

  return (
    <Box flexGrow={1} flexDirection="column" gap={2}>
      {isLoading && <Spinner label="Fetching custom fields..." />}

      {fields && (
        <Box flexDirection="column" gap={1}>
          <SelectCustomField
            fieldsToConfigure={Object.entries(fieldNames).map(
              ([value, label]) => ({ value, label }),
            )}
            customFields={fields}
            onSelect={(fields) => onSubmit(fields as T)}
          />
        </Box>
      )}
    </Box>
  );
};

const FinishStep = ({ data }: { data: OnboardingData }) => {
  const mutation = useMutation({
    mutationFn: async () => await finishOnboarding(data),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once
  useEffect(() => {
    mutation.mutate();
  }, []);

  return (
    <Box flexGrow={1} flexDirection="column" gap={2}>
      {mutation.isPending && <Spinner label="Finishing up..." />}

      {mutation.isError && (
        <Text color="red">Something went wrong: {mutation.error.message}</Text>
      )}

      {mutation.isSuccess && (
        <Text color="green">
          Onboarding complete! Restart the app to start using {APP_NAME}.
        </Text>
      )}
    </Box>
  );
};
