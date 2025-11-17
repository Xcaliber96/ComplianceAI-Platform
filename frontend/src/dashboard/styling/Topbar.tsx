import React from "react";
import "./topbar.css"; // make sure this file contains the CSS you provided

export default function Topbar() {
  return (
    <div className="topbar">
      {/* LEFT SECTION */}
      <div className="left">
        <h2>NomiAI</h2>
      </div>

      {/* RIGHT SECTION */}
      <div className="right">
        <div className="profile"></div>
      </div>
    </div>
  );
}
