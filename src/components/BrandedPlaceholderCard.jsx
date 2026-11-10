import React from 'react';

const BrandedPlaceholderCard = ({ title, subtitle, note }) => {
  return (
    <section className="rounded-2xl border border-[#D4A373]/30 bg-white p-6 shadow-md">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4A373]">{subtitle}</p>
      <h2 className="mb-3 text-2xl font-bold text-[#1B4332]">{title}</h2>
      <p className="rounded-xl border border-[#52B788]/25 bg-[#52B788]/10 px-4 py-3 text-sm text-[#1B4332]">{note}</p>
    </section>
  );
};

export default BrandedPlaceholderCard;
