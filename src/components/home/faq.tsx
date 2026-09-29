'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function Faq({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="faq-0"
      className="rounded-3xl border bg-background px-5 sm:px-7"
    >
      {items.map((item, index) => (
        <AccordionItem key={item.question} value={`faq-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
