import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="relative min-h-screen bg-white px-6 py-6">
      {/* Logout Button */}
      <div className="float-right top-6 right-6">
        <img
          src="/logout-btn.png"
          alt="Logout"
          onClick={handleLogout}
          className="w-25 h-25 cursor-pointer hover:opacity-75 transition"
        />
      </div>

      {/* Title Greetings */}
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-black">
            HELLO JUAN DELA CRUZ
          </h1>
          <p className="text-lg mt-2 ">WELCOME BACK!</p>
        </div>
      </div>

     
      <div className="px-4 md:px-10 text-left">
        <h2 className="text-2xl font-semibold text-black">YOUR LESSONS</h2>
        {/* Add lessons/components here */}
      </div>
    </div>
  );
}

export default StudentDashboard;
