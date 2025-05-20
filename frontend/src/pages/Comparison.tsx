
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ComparisonModal } from "@/components/comparison/ComparisonModal";

const Comparison = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Medicine Comparison</h1>
        </div>
      </div>

      <div className="prose max-w-none">
        <p>
          Use the comparison tool to compare medicine prices across different countries or 
          multiple medicines within a single country.
        </p>
        
        <h2>Features</h2>
        <ul>
          <li>Compare up to 5 medicines at once</li>
          <li>View prices in USD or local currency</li>
          <li>See visual charts of price differences</li>
          <li>Track historical price trends</li>
        </ul>

        <h2>How to use</h2>
        <ol>
          <li>Select one or more medicines to compare</li>
          <li>Choose countries where you want to see prices</li> 
          <li>Toggle between chart and table views</li>
          <li>Switch between bar charts and trend lines</li>
        </ol>
        
        <p className="font-medium mt-6">
          You can now access the comparison tool directly from the main map by clicking the "Compare" button
          in the top right corner.
        </p>
      </div>
    </div>
  );
};

export default Comparison;
