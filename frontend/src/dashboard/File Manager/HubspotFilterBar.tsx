import React, { useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function HubspotFilterBar({
  onSearch,
  onFilterType,
  onSort,
  onOpenAdvancedFilters,
  onAddFile,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sortValue, setSortValue] = useState("newest");

  const handleSearchChange = (e: any) => {
    setSearchValue(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        padding: "0.55rem 0.9rem",
        background: "#fff",
        borderRadius: "10px",
        border: "1px solid #e1e1e1",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* 🔍 Search */}
      <TextField
        size="small"
        placeholder="Search files..."
        value={searchValue}
        onChange={handleSearchChange}
        sx={{ flex: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ opacity: 0.6, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* 🟦 Filter Dropdown */}
      <TextField
        size="small"
        select
        value={filterValue}
        onChange={(e) => {
          setFilterValue(e.target.value);
          onFilterType(e.target.value);
        }}
        sx={{ minWidth: 120 }}

      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="policy">Policy</MenuItem>
        <MenuItem value="regulation">Regulation</MenuItem>
        <MenuItem value="evidence">Evidence</MenuItem>
        <MenuItem value="training">Training</MenuItem>
        <MenuItem value="contract">Contract</MenuItem>
        <MenuItem value="hr">HR</MenuItem>
        <MenuItem value="financial">Financial</MenuItem>
        <MenuItem value="other">Other</MenuItem>
      </TextField>

      {/* ↕ Sort */}
      <TextField
        size="small"
        select
        value={sortValue}
        onChange={(e) => {
          setSortValue(e.target.value);
          onSort(e.target.value);
        }}
        sx={{ minWidth: 120 }}

      >
        <MenuItem value="newest">Newest</MenuItem>
        <MenuItem value="oldest">Oldest</MenuItem>
        <MenuItem value="az">A → Z</MenuItem>
        <MenuItem value="za">Z → A</MenuItem>
      </TextField>

      {/* 🧩 Filters */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterListIcon sx={{ fontSize: 18 }} />}
        onClick={onOpenAdvancedFilters}
        sx={{
          padding: "4px 10px",
          textTransform: "none",
          borderRadius: "8px",
        }}
      >
        Filters
      </Button>

      {/* ➕ Add File */}
      <Button
        variant="contained"
        size="small"
        onClick={onAddFile}
        sx={{
          background: "#294936",
          padding: "4px 14px",
          textTransform: "none",
          borderRadius: "8px",
          "&:hover": { background: "#2f5d44" },
        }}
      >
        Add File
      </Button>
    </Box>
  );
}
