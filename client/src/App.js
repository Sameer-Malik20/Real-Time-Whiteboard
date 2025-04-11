import "bootstrap/dist/css/bootstrap.min.css";
import Whiteboard from "./component/whiteBoard";



function App() {
return (
    <div className="container">
      <h1 className="text-center">Real-Time Document Editor</h1>
      <Whiteboard />
    </div>
  );
}

export default App;
