import "./topbar.css";

export default function Topbar() {
  return (
    <div className="topbar">
      <div className="left">
        <h2>Nomi</h2>
      </div>

      <div className="right">
        <img
          src="https://avatars.githubusercontent.com/u/1?v=4"
          alt="profile"
          className="profile"
        />
      </div>
    </div>
  );
}