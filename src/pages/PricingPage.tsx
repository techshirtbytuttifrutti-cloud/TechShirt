import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

const pricingPlans = [
  {
    name: "Basic",
    price: "For orders of 15 shirts and below",
    features: ["Unlimited orders", "Premium designs"],
  },
  {
    name: "Promo",
    price: "For orders of more than 15 shirts",
    features: [
      "Unlimited orders",
      "Premium designs",
      "No designer fee",
      "First 2 revisions free",
    ],
  },
];

const PricingPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="font-sans text-gray-800 bg-gradient-to-r from-white to-teal-50"
    >
      <Navbar />

      {/* Intro Section */}
      <section className="px-6 py-12 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Plans</h1>
        <p className="mt-3 text-base text-gray-600">
          Choose the perfect plan for your t-shirt design workflow.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="grid grid-cols-1 gap-6 px-6 pb-16 md:grid-cols-2 max-w-5xl mx-auto">
        {pricingPlans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex flex-col items-center text-center bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:border-teal-500 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-xl font-semibold text-teal-600">{plan.name}</h3>
            <p className="mt-2 text-lg font-bold text-gray-900">{plan.price}</p>

            <ul className="mt-4 space-y-1.5 text-gray-700 text-sm text-left w-full">
              {plan.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 before:content-['✔'] before:text-teal-500 before:text-sm"
                >
                  {feature}
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="mt-5 px-5 py-2.5 font-medium text-white bg-teal-500 rounded-md w-full md:w-auto hover:bg-teal-600 transition-colors"
            >
              <a href="/signup">Choose Plan</a>
            </motion.button>
          </motion.div>
        ))}
      </section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-14 text-center text-white bg-teal-500"
      >
        <h2 className="text-2xl md:text-3xl font-semibold">Get Started Today</h2>
        <p className="mt-1 text-base md:text-lg">
          Create and collaborate on custom t-shirt designs effortlessly.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2.5 mt-5 font-semibold text-teal-500 bg-white rounded-md text-base"
        >
          <a href="/signup">Sign Up Now</a>
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer className="w-full px-6 py-8 text-gray-400 bg-gray-900">
        <div className="grid max-w-6xl grid-cols-1 gap-4 mx-auto md:grid-cols-3">
          <div>
            <h3 className="text-base font-bold text-white">TechShirt</h3>
            <p className="text-sm">
              Where creativity meets collaboration.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-base">Explore</h4>
            <a href="/features" className="block mt-1 text-sm">Features</a>
            <a href="/how-it-works" className="block mt-1 text-sm">How It Works</a>
            <a href="/pricing" className="block mt-1 text-sm">Pricing</a>
          </div>

          <div>
            <h4 className="font-bold text-white text-base">Company</h4>
            <a href="/about" className="block mt-1 text-sm">About Us</a>
            <a href="/contact" className="block mt-1 text-sm">Contact</a>
            <a href="/careers" className="block mt-1 text-sm">Careers</a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default PricingPage;
