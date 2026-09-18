"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FieldLabel, FormMessage, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { updateProfileAction, updateSettingsAction } from "./actions";

const initialState: ActionState = {};

type Profile = {
  full_name: string | null;
  timezone: string;
  currency: string;
  default_daily_capacity_minutes: number;
};

type Workspace = {
  business_name: string | null;
  address: string | null;
  tax_id: string | null;
  default_currency: string;
  default_tax_rate: number;
  quote_prefix: string;
  invoice_prefix: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfileAction, initialState);
  const capacityHours = profile.default_daily_capacity_minutes / 60;
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Full name" htmlFor="profile-name" />
          <TextInput id="profile-name" name="full_name" defaultValue={profile.full_name} placeholder="The agency owner" />
        </div>
        <div>
          <FieldLabel label="Timezone" htmlFor="profile-timezone" required />
          <TextInput id="profile-timezone" name="timezone" required defaultValue={profile.timezone} placeholder="Europe/Berlin" />
        </div>
        <div>
          <FieldLabel label="Currency" htmlFor="profile-currency" required />
          <TextInput id="profile-currency" name="currency" required defaultValue={profile.currency} placeholder="USD" />
        </div>
        <div>
          <FieldLabel label="Default work capacity" htmlFor="profile-capacity" hint="hours per day" required />
          <TextInput
            id="profile-capacity"
            name="daily_capacity_hours"
            type="number"
            min={0}
            max={24}
            step={0.25}
            required
            defaultValue={capacityHours}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Save profile</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function WorkspaceForm({ settings }: { settings: Workspace }) {
  const [state, action] = useActionState(updateSettingsAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Business name" htmlFor="ws-name" />
          <TextInput id="ws-name" name="business_name" defaultValue={settings.business_name} placeholder="Agency Zero" />
        </div>
        <div>
          <FieldLabel label="Tax ID" htmlFor="ws-tax-id" hint="optional" />
          <TextInput id="ws-tax-id" name="tax_id" defaultValue={settings.tax_id} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel label="Address" htmlFor="ws-address" hint="optional" />
          <TextArea id="ws-address" name="address" rows={2} defaultValue={settings.address} />
        </div>
        <div>
          <FieldLabel label="Default currency" htmlFor="ws-currency" required />
          <TextInput id="ws-currency" name="default_currency" required defaultValue={settings.default_currency} placeholder="USD" />
        </div>
        <div>
          <FieldLabel label="Default tax rate" htmlFor="ws-tax-rate" hint="percent" required />
          <TextInput
            id="ws-tax-rate"
            name="default_tax_rate"
            type="number"
            min={0}
            max={100}
            step={0.01}
            required
            defaultValue={settings.default_tax_rate}
          />
        </div>
        <div>
          <FieldLabel label="Quote number prefix" htmlFor="ws-quote-prefix" required />
          <TextInput id="ws-quote-prefix" name="quote_prefix" required defaultValue={settings.quote_prefix} placeholder="Q-" />
        </div>
        <div>
          <FieldLabel label="Invoice number prefix" htmlFor="ws-invoice-prefix" required />
          <TextInput id="ws-invoice-prefix" name="invoice_prefix" required defaultValue={settings.invoice_prefix} placeholder="INV-" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Save workspace settings</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}
