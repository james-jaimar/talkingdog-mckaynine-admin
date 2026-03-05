import { EmailSignature } from "@/hooks/useEmailSignatures";

interface SignaturePreviewProps {
  signature: EmailSignature;
}

export function SignaturePreview({ signature }: SignaturePreviewProps) {
  const companyLine = signature.company ? `${signature.company}<br>` : "";

  const html = `<p style="margin: 20px 0 0 0; font-size: 14px; color: #333333; line-height: 1.6;">
    <strong style="color: #2c5530;">${signature.name}</strong><br>
    ${signature.title}<br>
    📞 ${signature.phone}<br>
    ${companyLine}✉️ <a href="mailto:${signature.email}" style="color: #3b82f6; text-decoration: none;">${signature.email}</a><br>
    🌐 <a href="https://${signature.website}" style="color: #3b82f6; text-decoration: none;">${signature.website}</a>
  </p>`;

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
