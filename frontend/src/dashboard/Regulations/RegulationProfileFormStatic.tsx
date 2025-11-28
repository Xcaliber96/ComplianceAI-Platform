import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function RegulationsPage() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Sidebar */}
      

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Regulations</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Fill out details to tailor compliance detection for your business.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button variant="secondary" className="px-6 py-2 text-[15px]">Cancel</Button>
            <Button className="bg-green-700 hover:bg-green-800 text-white px-8 py-2 text-[15px] shadow-lg rounded-xl">
              Save
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Company Scope */}
          <Card className="mb-10 border-none shadow-xl rounded-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Company Scope</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-[15px]">
                    Operating Regions
                  </label>
                  <Input placeholder="Select regions" className="h-12 rounded-xl" />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-[15px]">
                    Customer Locations
                  </label>
                  <Input placeholder="Select locations" className="h-12 rounded-xl" />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-[15px]">
                    Entity Type
                  </label>
                  <Input placeholder="Select entity type" className="h-12 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Categories */}
          <Card className="mb-10 border-none shadow-xl rounded-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Data Categories</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  "Personal Data",
                  "Sensitive Data",
                  "Financial Data",
                  "Credit Card Information",
                  "Healthcare / PHI",
                  "Children’s Data",
                ].map((item) => (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    key={item}
                    className="border rounded-xl p-5 bg-white hover:border-green-600 hover:shadow-lg cursor-pointer transition-all text-[15px] font-medium text-gray-800"
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Activities */}
          <Card className="mb-10 border-none shadow-xl rounded-2xl">
            <CardContent className="p-8 space-y-8">
              <h2 className="text-2xl font-semibold text-gray-900">Business Activities</h2>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-[15px]">Industry Type</label>
                <Input placeholder="Select industry" className="h-12 rounded-xl" />
              </div>

              <div className="space-y-3">
                <label className="block text-gray-700 font-medium text-[15px]">
                  Do you accept payments?
                </label>
                <div className="flex space-x-10 text-gray-700 text-[15px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="payments" /> <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="payments" /> <span>No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium text-[15px]">
                  Annual Transaction Volume
                </label>
                <Input type="number" placeholder="Enter amount" className="h-12 rounded-xl" />
              </div>

              <div className="space-y-3">
                <label className="block text-gray-700 font-medium text-[15px]">
                  Are you a government contractor?
                </label>
                <div className="flex space-x-10 text-gray-700 text-[15px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="gov" /> <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="gov" /> <span>No</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Size */}
          <Card className="border-none shadow-xl rounded-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Company Size</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-[15px]">
                    Employee Count
                  </label>
                  <Input type="number" placeholder="Total employees" className="h-12 rounded-xl" />
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 font-medium text-[15px]">
                    Annual Revenue (optional)
                  </label>
                  <Input type="number" placeholder="Enter revenue" className="h-12 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
      </main>
    </div>
  );
}
