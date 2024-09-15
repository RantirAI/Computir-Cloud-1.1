import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import type { AiProviderMetadata } from '@activepieces/pieces-common';
import { AiProviderConfig } from '@activepieces/shared';
import { Static, Type } from '@sinclair/typebox';

const EnableAiProviderConfigInput = Type.Composite([
  Type.Omit(AiProviderConfig, ['id', 'created', 'updated', 'platformId']),
  Type.Object({
    id: Type.Optional(Type.String()),
  }),
])
export type EnableAiProviderConfigInput = Static<typeof EnableAiProviderConfigInput>

type UpsertAIProviderDialogProps = {
  provider: EnableAiProviderConfigInput;
  providerMetadata: AiProviderMetadata,
  children: React.ReactNode;
  onSave: () => void;
};

export const UpsertAIProviderDialog = ({
  children,
  onSave,
  provider,
  providerMetadata
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: typeboxResolver(EnableAiProviderConfigInput),
    defaultValues: provider,
  });

  const { toast } = useToast();

  const formState = form.watch();

  console.log("formState", formState)

  const { mutate, isPending } = useMutation({
    mutationKey: ['upsert-proxy-config'],
    mutationFn: () => aiProviderApi.upsert({
      ...form.getValues(),
      config: {
        ...form.getValues().config,
        defaultHeaders: (() => {
          const headerValue = form.getValues().config.defaultHeaders[providerMetadata.auth.name];
          if (typeof headerValue === 'string' && headerValue.trim() !== '') {
            return {
              [providerMetadata.auth.name]: providerMetadata.auth.mapper(headerValue)
            };
          }
          return {};
        })()
      }
    }),
    onSuccess: (data) => {
      form.reset(data);
      setOpen(false);
      onSave();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset(provider);
        }
        setOpen(open);
      }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{provider.id ? t('Update AI Provider') : t('Enable AI Provider')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FormField
              name="baseUrl"
              render={({ field }) => (
                <FormItem className="grid space-y-2" itemType='url'>
                  <Label htmlFor="baseUrl">{t('Base URL')}</Label>
                  <Input
                    {...field}
                    required
                    type="url"
                    id="baseUrl"
                    placeholder={t('Base URL')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name={`config.defaultHeaders.${providerMetadata.auth.name}`}
              defaultValue={provider.id ? "" : undefined}
              render={({ field }) => (
                <FormItem className="grid space-y-3">
                  <Label htmlFor={`config.defaultHeaders.${providerMetadata.auth.name}`}>{t('API Key')}</Label>
                  <div className='flex gap-2 items-center justify-center'>
                    <Input
                      autoFocus
                      {...field}
                      required
                      id={`config.defaultHeaders.${providerMetadata.auth.name}`}
                      placeholder={t('sk_************************')}
                      className="rounded-sm"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex flex-col gap-2'>
              <h1 className='text-lg font-semibold'>{t('Credits Criteria')}</h1>
              <p className='text-sm text-muted-foreground'>{t('The credits criteria is the number of project AI credits consumed per request for each model.')}</p>
            </div>

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant={'outline'}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setOpen(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={!form.formState.isValid}
            loading={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              mutate();
            }}
          >
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};