import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Chatbot from "./pages/Chatbot";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/chat" element={<Chatbot />} />

      </Routes>

    </BrowserRouter>

  );

}

export default App;