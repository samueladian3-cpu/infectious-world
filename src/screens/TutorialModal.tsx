import { useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { Modal } from '../components/Modal';
import { CONFIG } from '../game/config';

const STEPS: { icon: IconName; title: string; body: string[] }[] = [
  {
    icon: 'virus',
    title: '1. Peranmu',
    body: [
      'Kamu memerankan simulasi patogen fiktif (Rhinovirus) di komunitas virtual Dusun Kuannoah.',
      'Sudut pandang terbalik ini dipakai untuk menunjukkan mengapa pencegahan dan kesadaran komunitas penting. Ini bukan ajakan menyebarkan penyakit di dunia nyata.',
      'Menang: Infection Progress 100%. Kalah: Community Awareness 100%. Jika keduanya tercapai bersamaan, kekalahan diutamakan.',
    ],
  },
  {
    icon: 'coin',
    title: '2. Infection Points (IP)',
    body: [
      `Kamu mendapat 1 IP setiap ${CONFIG.ipIntervalSeconds} detik simulasi secara otomatis.`,
      'IP dipakai untuk membeli mutasi dan aksi khusus. Saldo tidak bisa minus; pembelian yang tidak valid ditolak tanpa mengubah apa pun.',
    ],
  },
  {
    icon: 'dna',
    title: '3. Mutation Tree',
    body: [
      'Ada tiga cabang: Transmisi, Visibilitas Gejala, dan Persistensi Lingkungan. Node tingkat 2 butuh node tingkat 1.',
      'Hati-hati: gejala yang lebih terlihat mempercepat infeksi sedikit, tetapi membuat komunitas sadar jauh lebih cepat.',
    ],
  },
  {
    icon: 'shield',
    title: '4. Awareness & Behavior Shield',
    body: [
      `Setiap ${CONFIG.shield.intervalSeconds} detik, komunitas menjalankan perilaku pelindung: cuci tangan, etika batuk, masker & udara bersih, pengenalan gejala dini, atau edukasi kesehatan.`,
      'Event ini memperlambat infeksi atau menaikkan awareness. Di dunia nyata, kebiasaan seperti ini membantu mengurangi penyebaran virus pernapasan.',
    ],
  },
  {
    icon: 'megaphone',
    title: '5. Misinformation Surge',
    body: [
      `Aksi fiktif sekali pakai (${CONFIG.misinformation.cost} IP): kebingungan informasi menurunkan awareness ${CONFIG.misinformation.awarenessReduction} poin.`,
      `Setelah ${CONFIG.misinformation.factCheckDelaySeconds} detik, Fact-Check Response dari tenaga kesehatan menaikkan awareness ${CONFIG.misinformation.factCheckAwarenessIncrease} poin.`,
      'Pesannya: misinformasi berbahaya karena menunda tindakan yang tepat, dan informasi kredibel adalah penangkalnya.',
    ],
  },
];

interface Props {
  onClose: () => void;
  onFinish: () => void;
}

export function TutorialModal({ onClose, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Modal
      title="How to Play"
      onClose={onClose}
      closeLabel="Tutup tutorial"
      footer={
        <>
          <div className="dots" aria-label={`Langkah ${step + 1} dari ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`dot${i === step ? ' dot-on' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Ke langkah ${i + 1}`}
                aria-current={i === step ? 'step' : undefined}
              />
            ))}
          </div>
          <div className="foot-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
              Sebelumnya
            </button>
            {last ? (
              <button type="button" className="btn btn-primary" onClick={onFinish}>
                Mengerti, Ayo Main!
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
                Berikutnya
              </button>
            )}
          </div>
        </>
      }
    >
      <div className="tutorial-step" key={step}>
        <div className="tut-icon">
          <Icon name={s.icon} size={40} />
        </div>
        <h3>{s.title}</h3>
        {s.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Modal>
  );
}
