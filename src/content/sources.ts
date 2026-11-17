export interface Source {
  title: string;
  publisher: string;
  url: string;
}

/** Semua tautan sudah diperiksa dan isinya mendukung klaim terkait (diperiksa Oktober 2026). */
export const SOURCES = {
  cdcRhino: { title: 'About Rhinoviruses', publisher: 'CDC', url: 'https://www.cdc.gov/rhinoviruses/about/' },
  cdcHygiene: {
    title: 'Hygiene and Respiratory Viruses Prevention',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/respiratory-viruses/prevention/hygiene.html',
  },
  cdcColdTreatment: { title: 'Manage Common Cold', publisher: 'CDC', url: 'https://www.cdc.gov/common-cold/treatment/' },
  cdcEcoli: { title: 'About Escherichia coli Infection', publisher: 'CDC', url: 'https://www.cdc.gov/ecoli/about/index.html' },
  cdcEcoliSymptoms: {
    title: 'Symptoms of E. coli Infection',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/ecoli/signs-symptoms/index.html',
  },
  cdcEcoliPrevention: {
    title: 'How to Prevent E. coli infection',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/ecoli/prevention/index.html',
  },
  cdcDengue: { title: 'About Dengue', publisher: 'CDC', url: 'https://www.cdc.gov/dengue/about/index.html' },
  cdcDengueSymptoms: {
    title: 'Symptoms of Dengue and Testing',
    publisher: 'CDC',
    url: 'https://www.cdc.gov/dengue/signs-symptoms/index.html',
  },
  cdcDenguePrevention: { title: 'Preventing Dengue', publisher: 'CDC', url: 'https://www.cdc.gov/dengue/prevention/index.html' },
  /* WHO & Kemenkes RI (diperiksa November 2026). */
  whoTb: { title: 'Tuberculosis: fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/tuberculosis' },
  whoHiv: { title: 'HIV and AIDS: fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids' },
  whoDengue: { title: 'Dengue and severe dengue: fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue' },
  whoDiarrhoea: { title: 'Diarrhoeal disease: fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease' },
  whoInfluenza: { title: 'Influenza (seasonal): fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)' },
  whoPneumonia: { title: 'Pneumonia in children: fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/pneumonia' },
  whoMalaria: { title: 'Malaria: fact sheet', publisher: 'WHO', url: 'https://www.who.int/news-room/fact-sheets/detail/malaria' },
  cdcAmebiasis: { title: 'About Amebiasis', publisher: 'CDC', url: 'https://www.cdc.gov/amebiasis/about/index.html' },
  cdcRotavirus: { title: 'About Rotavirus', publisher: 'CDC', url: 'https://www.cdc.gov/rotavirus/about/index.html' },
  kemkesToss: { title: 'Apa itu TOSS TBC dan Kenali Gejala TBC', publisher: 'Kemenkes RI', url: 'https://www.kemkes.go.id/id/apa-itu-toss-tbc-dan-kenali-gejala-tbc' },
  kemkesPsn: { title: 'Kendalikan DBD dengan PSN 3M Plus', publisher: 'Kemenkes RI', url: 'https://www.kemkes.go.id/id/kendalikan-dbd-dengan-psn-3m-plus' },
  kemkesHiv: { title: 'Jangan Jauhi ODHA, HIV/AIDS tidak Mudah Menular', publisher: 'Kemenkes RI', url: 'https://kemkes.go.id/id/jangan-jauhi-odha-hivaids-tidak-mudah-menular' },
  kemkesDiare: { title: 'Diare, Tanda Gejala dan Cara Mengatasinya', publisher: 'Kemenkes RI', url: 'https://keslan.kemkes.go.id/view_artikel/279/diare-tanda-gejala-dan-cara-mengatasinya' },
  /* Sumber ukuran patogen (diperiksa Oktober 2026). */
  sizeRhino: {
    title: 'Impact of Rhinovirus Infections in Children (Viruses, 2019): diameter rata-rata sekitar 30 nm',
    publisher: 'NIH PMC',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6632063/',
  },
  sizeEcoli: {
    title: 'An Escherichia coli Mutant That Makes Exceptionally Long Cells (J Bacteriol, 2015): batang 0,5 µm × 2 µm',
    publisher: 'NIH PMC',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4372735/',
  },
  sizeDengue: {
    title: 'Dengue and human health (Saudi J Biol Sci, 2021): flavivirus bulat berdiameter 50 nm',
    publisher: 'NIH PMC',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8381008/',
  },
} satisfies Record<string, Source>;
