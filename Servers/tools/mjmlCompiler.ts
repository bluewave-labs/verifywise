import mjml2html from "mjml";

export const compileMjmlToHtml = (
  mjmlTemplate: string,
  data: Record<string, string>
): string => {
  // Replace placeholders with actual data
  let compiledTemplate = mjmlTemplate;
  Object.keys(data).forEach((key) => {
    compiledTemplate = compiledTemplate.replace(
      new RegExp(`{{${key}}}`, "g"),
      data[key]
    );
  });

  // Convert MJML to HTML
  const { html } = mjml2html(compiledTemplate);
  return html;
};
