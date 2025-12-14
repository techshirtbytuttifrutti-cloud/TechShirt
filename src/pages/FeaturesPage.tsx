import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import feature1 from "../images/picture1.jpg"; // replace with actual images
import feature2 from "../images/picture2.jpg";
import feature3 from "../images/picture3.jpg";

// Define the shape of each feature
interface FeatureItem {
  title: string;
  description: string;
  image: string;
}

const featureItems: FeatureItem[] = [
  {
    title: "Real-Time Design Sync",
    description: "Collaborate with designers and clients seamlessly. Changes made on one device are instantly reflected across all devices, ensuring your ideas are always up to date.",
    image: feature1,
  },
  {
    title: "High-Quality Printing",
    description: "TechShirt guarantees crisp, vibrant prints for every custom design. Our printing technology ensures durability and colors that pop.",
    image: feature2,
  },
  {
    title: "Easy File Management",
    description: "Keep all your t-shirt designs organized in one place. Upload, store, and manage your files with ease, ensuring a smooth workflow from concept to print.",
    image: feature3,
  },
];

const FeaturesPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="font-sans text-gray-800 bg-gradient-to-r from-white to-teal-50"
    >
      <Navbar />

      {/* Intro Section */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900">Features of TechShirt</h1>
        <p className="mt-4 text-lg text-gray-600">
          TechShirt is designed to make t-shirt creation effortless. From syncing designs to printing high-quality shirts, our platform simplifies every step.
        </p>
      </section>

      {/* Features Cards */}
      <section className="grid grid-cols-1 gap-12 px-6 pb-20 md:grid-cols-3 max-w-7xl mx-auto">
        {featureItems.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <img
              src={feature.image}
              alt={feature.title}
              className="mb-6 rounded-lg shadow-md object-cover w-full h-60"
            />
            <h3 className="text-lg font-semibold text-teal-600 uppercase tracking-wider">
              {feature.title}
            </h3>
            <p className="mt-3 text-gray-700">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-16 text-center text-white bg-teal-500"
      >
        <h2 className="text-3xl font-bold">Start Creating Today</h2>
        <p className="mt-2">
          Explore TechShirt and experience the easiest way to bring your t-shirt designs to life.
        </p>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 mt-6 font-semibold text-teal-500 bg-white rounded-lg"
        >
          <a href="/signup">Get Started</a>
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer className="w-full px-6 py-10 text-gray-400 bg-gray-900">
        <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-white">TechShirt</h3>
            <p>Where creativity meets collaboration. Build t-shirts, build connections.</p>
          </div>
          <div>
            <h4 className="font-bold text-white">Explore</h4>
            <a href="/features" className="block mt-2">Features</a>
            <a href="/how-it-works" className="block mt-2">How It Works</a>
            <a href="/pricing" className="block mt-2">Pricing</a>
          </div>
          <div>
            <h4 className="font-bold text-white">Company</h4>
            <a href="/about" className="block mt-2">About Us</a>
            <a href="/contact" className="block mt-2">Contact</a>
            <a href="/careers" className="block mt-2">Careers</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default FeaturesPage;
