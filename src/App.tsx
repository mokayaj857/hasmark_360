import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Hero from "./Components/Hero";
import Home from "./Components/Home";
import Header from "./Components/Header";
import Nav from "./Components/Nav";
import Scroll from "./Components/scroll";
import White from "./Components/white";
import About from "./Components/About";
import Solution from "./Components/Solution";
import Test from "./Components/Test";
import Verify from "./Components/Verify";
import Data360Passport from "./Components/Data360Passport";
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Qrcode under Testimonials */}
        <Route path="/hero" element={<Hero />} /> 
        <Route path="/" element={<Home />} />
        <Route path="/nav" element={<Nav />} />
        <Route path="/white" element={<White />} />
        <Route path="/solution" element={<Solution />} />
        <Route path="/header" element={<Header />} />
        <Route path="/about" element={<About />} />
        <Route path="/scroll" element={<Scroll />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/passport" element={<Data360Passport />} />
        <Route path="/test" element={<Test />} />
        {/* <Route path="weather" element={<Weather />} /> */}
        {/* <Route path="kenya" element={<Kenya />} /> */}
        {/* <Route path="home" element={<Home />} /> */}
        {/* <Route path="chatbot" element={<Chatbot />} /> */} 
      </Routes>   
    </Router>
  );
};

export default App;
