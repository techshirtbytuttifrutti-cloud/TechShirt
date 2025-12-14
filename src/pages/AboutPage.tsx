import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import about1 from "../images/1.png";
import about2 from "../images/2.png";
import about3 from "../images/3.png";
import dev1 from "../images/aia.png";
import dev2 from "../images/cj.jpeg";
import dev3 from "../images/annie.jpg";

// About items
interface AboutItem {
  title: string;
  text: string;
  image: string;
}
const aboutItems: AboutItem[] = [
  {
    title: "3D Shirt Modeling",
    text: "Visualize your ideas instantly with our interactive 3D shirt model. Rotate, zoom, and preview your designs in real time for accurate placement and print-ready results.",
    image: about1,
  },
  {
    title: " Design Syncing",
    text: "Design changes update instantly across the platform—whether you're editing on the canvas or collaborating with a designer. No delays, no outdated versions, just seamless syncing.",
    image: about2,
  },
  {
    title: "Designer–Client Workflow",
    text: "Chat, review, and approve designs all in one place. Clients and designers collaborate efficiently through built-in messaging, updates, and streamlined request handling.",
    image: about3,
  },
];
// Team members
const developers = [
  {
    name: "Aia Celina De Tablan",
    role: "Project Manager",
    image: dev1,
    description:
      "Aia oversees project timelines, manages team coordination, and ensures every feature is delivered with clarity, alignment, and high quality."
  },
  {
    name: "Christine Joy Laureano",
    role: "Researcher",
    image: dev2,
    description:
      "Christine conducts in-depth research, gathers user insights, and analyzes data to guide the team in developing meaningful and user-focused features."
  },
  {
    name: "Annie Gonora",
    role: "Programmer",
    image: dev3,
    description:
      "Annie develops core platform functionalities, implements new features, and ensures the system runs smoothly with reliable and optimized code."
  }
];
const AboutPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="font-sans text-gray-800 bg-gradient-to-r from-white to-teal-50"
    >
      <Navbar />

      {/* TechShirt Description */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900">About TechShirt</h1>
        <p className="mt-4 text-lg text-gray-600">
          TechShirt is a platform that merges creativity with technology. From designing custom t-shirts to collaborating with fellow designers, we make it easy to bring your ideas to life while ensuring a seamless user experience.
        </p>
      </section>

      {/* About Cards */}
      <section className="grid grid-cols-1 gap-12 px-6 pb-20 md:grid-cols-3 max-w-7xl mx-auto">
        {aboutItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className="flex flex-col items-center text-center"
          >
            <img
              src={item.image}
              alt={item.title}
              className="mb-6 rounded-lg shadow-md object-cover w-full h-60"
            />
            <h3 className="text-lg font-semibold text-teal-600 uppercase tracking-wider">
              {item.title}
            </h3>
            <p className="mt-3 text-gray-700">{item.text}</p>
          </motion.div>
        ))}
      </section>

        

 
    <section className="px-6 py-20 bg-white">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Developers</h2>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3 max-w-6xl mx-auto">
        {developers.map((dev, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <img
              src={dev.image}
              alt={dev.name}
              className="w-40 h-40 rounded-full object-cover mb-4 shadow-md"
            />
            <h3 className="text-lg font-semibold text-gray-800">{dev.name}</h3>
            <p className="text-teal-600 text-sm font-medium mb-2">{dev.role}</p>
            <p className="text-gray-600 text-sm">{dev.description}</p>
          </motion.div>
        ))}
      </div>
    </section>


      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="py-16 text-center text-white bg-teal-500"
      >
        <h2 className="text-3xl font-bold">Design with Us, Not Alone</h2>
        <p className="mt-2">
          Join our platform and discover how smooth collaboration can be.
        </p>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 mt-6 font-semibold text-teal-500 bg-white rounded-lg"
        >
          <a href="/register">Start Your Journey</a>
        </motion.button>
      </motion.section>

      {/* Footer */}
      <footer className="w-full px-6 py-10 text-gray-400 bg-gray-900">
        <div className="grid max-w-6xl grid-cols-1 gap-6 mx-auto md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-white">TechShirt</h3>
            <p>
              Where creativity meets collaboration. Build t-shirts, build
              connections.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white">Explore</h4>
            <a href="/features" className="block mt-2">
              Features
            </a>
            <a href="/how-it-works" className="block mt-2">
              How It Works
            </a>
            <a href="/pricing" className="block mt-2">
              Pricing
            </a>
          </div>
          <div>
            <h4 className="font-bold text-white">Company</h4>
            <a href="/about" className="block mt-2">
              About Us
            </a>
            <a href="/contact" className="block mt-2">
              Contact
            </a>
            <a href="/careers" className="block mt-2">
              Careers
            </a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default AboutPage;
