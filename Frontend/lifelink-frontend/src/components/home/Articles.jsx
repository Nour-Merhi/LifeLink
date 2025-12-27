import { useNavigate } from "react-router-dom";

const articles = [
  {
    id: 1,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png", 
    link: "/article1",
  },
  {
    id: 2,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png",
    link: "/article2",
  },
  {
    id: 3,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png",
    link: "/article3",
  },
  {
    id: 4,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png",
    link: "/article4",
  },
  {
    id: 5,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png",
    link: "/article5",
  },
  {
    id: 6,
    title: "The Complete Guide to Blood Donation: What You Need to Know",
    excerpt: "Everything from eligibility requirements to the donation process, plus how your donation saves lives and health benefits for donors.",
    imageSrc: "/image.png",
    link: "/article6",
  },
];

export default function ArticlesSection() {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-8 py-16 max-w-7xl mx-auto rounded-lg">
      <div className="mb-12 max-w-4xl text-center mx-auto">
  <p className="text-gray-400 mb-2">
    News
  </p>
  <h2 className="text-3xl font-bold mb-2">
    Health & Donation Articles
  </h2>
  <p className="text-gray-400">
    Stay informed with the latest research, guides, and insights about blood, organ donation, and health topics from our medical experts.
  </p>
</div>


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
  {articles.map(({ id, title, excerpt, imageSrc, link }) => (
    <article key={id} className="bg-gray-850 rounded-xl overflow-hidden shadow-md flex flex-col">
      <img
        src={imageSrc}
        className="w-full h-36 object-cover rounded-t-xl"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-white text-base mb-1 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-gray-400 flex-grow leading-relaxed">
          {excerpt}
        </p>
        <button
          onClick={() => navigate(link)}
          className="mt-4 bg-gradient-to-r from-red-800 to-red-600 text-white px-4 py-2 rounded-full flex items-center justify-center text-sm transition"
        >
          Read Article <span className="ml-2 text-lg font-bold">→</span>
        </button>
      </div>
    </article>
  ))}
</div>

    </section>
  );
}
