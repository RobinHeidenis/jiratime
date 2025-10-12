import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import clipboard from "clipboardy";
import { useState } from "react";
import z from "zod";
import { useMeQuery } from "../api/get-me.query";
import { Button } from "../button.tsx";
import { useRequester } from "../hooks/use-requester";
import type { pages } from "../pages.ts";

const inputs = {
  url: 0,
  email: 1,
  apiToken: 2,
  submit: 3,
} as const;

const formSchema = z.object({
  url: z.url("Invalid URL"),
  email: z.email("Invalid email"),
  apiToken: z.string().min(1, "API Token is required"),
});

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <text alignSelf="flex-start" style={{ fg: "brightRed" }}>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>
          {field.state.meta.errors.map((error) => error.message).join(", ")}
        </em>
      ) : (
        ""
      )}
    </text>
  );
}

export const SetupPage = ({
  setPage,
}: {
  setPage: (page: keyof typeof pages) => void;
}) => {
  const [selectedInput, setSelectedInput] = useState<number>(inputs.url);
  const [requester, setRequester] = useState<ReturnType<
    typeof useRequester
  > | null>(null);

  const form = useForm({
    defaultValues: {
      url: "",
      email: "",
      apiToken: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: ({ value }) => {
      console.log(value);
      setRequester(useRequester(value.url, value.apiToken));
    },
  });

  // const { isLoading, data: user } = useMeQuery(requester);
  const isLoading = false;
  const user = null;

  useKeyboard(async (key) => {
    if (key.name === "tab" && key.shift) {
      setSelectedInput(
        (s) =>
          (s - 1 + Object.keys(inputs).length) % Object.keys(inputs).length,
      );
      return;
    }

    if (key.name === "tab") {
      setSelectedInput((s) => (s + 1) % Object.keys(inputs).length);
    }

    if (key.name === "v" && key.ctrl) {
      const fieldKey = Object.keys(inputs)[
        selectedInput
      ] as keyof typeof inputs;
      const data = await clipboard.read();
      const existingValue = form.getFieldValue(
        fieldKey as "url" | "email" | "apiToken",
      );
      form.setFieldValue(
        fieldKey as "url" | "email" | "apiToken",
        existingValue + data,
      );
    }
  });

  return (
    <box alignItems="center" justifyContent="center" flexGrow={1}>
      <box alignItems="center" justifyContent="center" flexGrow={1} width={60}>
        <box justifyContent="center" alignItems="flex-end">
          <ascii-font font="block" text="JiraTime" />
          <text attributes={TextAttributes.DIM}>What are we doing today?</text>
        </box>
        <text marginTop={1} marginBottom={1}>
          Setup
        </text>

        {isLoading ? (
          <text>Loading...</text>
        ) : user ? (
          <text>Welcome, {user}!</text>
        ) : (
          <>
            <form.Field
              name="url"
              children={(field) => (
                <>
                  <box
                    title="Jira URL"
                    style={{ border: true, height: 3 }}
                    width="100%"
                  >
                    <input
                      placeholder="https://your-domain.atlassian.net"
                      focused={selectedInput === inputs.url}
                      onInput={field.setValue}
                      value={field.state.value}
                    />
                  </box>
                  <FieldInfo field={field} />
                </>
              )}
            />
            <form.Field
              name="email"
              children={(field) => (
                <>
                  <box
                    title="Email"
                    style={{ border: true, height: 3, marginTop: 1 }}
                    width="100%"
                  >
                    <input
                      placeholder="email@example.com"
                      focused={selectedInput === inputs.email}
                      onInput={field.setValue}
                      value={field.state.value}
                    />
                  </box>
                  <FieldInfo field={field} />
                </>
              )}
            />

            <form.Field
              name="apiToken"
              children={(field) => (
                <>
                  <box
                    title="API Token"
                    style={{ border: true, height: 3, marginTop: 1 }}
                    width="100%"
                  >
                    <input
                      placeholder="ATATT3xxxx"
                      focused={selectedInput === inputs.apiToken}
                      onInput={field.setValue}
                      value={field.state.value}
                    />
                  </box>
                  <FieldInfo field={field} />
                </>
              )}
            />

            <Button
              label="Next"
              selected={selectedInput === inputs.submit}
              onSelect={form.handleSubmit}
              styles={{ marginTop: 2 }}
            />
          </>
        )}
      </box>
    </box>
  );
};
