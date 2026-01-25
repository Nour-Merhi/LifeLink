const ORGAN_INFO = {
    heart: {
      name: "Heart",
      canDonate: true,
      description: "The heart is a vital organ that pumps blood throughout the body, supplying oxygen and nutrients while removing waste. It can be donated to save patients with severe heart failure under specific conditions.",
      impact: "Gives a patient with heart failure a new chance at life.",
    },
    lungs: {
      name: "Lungs",
      canDonate: true,
      description: "The lungs are responsible for breathing, exchanging oxygen and carbon dioxide between the air and blood. Lungs or even a single lobe can be donated to patients in need of a transplant.",
      impact: "Allows patients with severe lung disease to breathe normally again.",
    },
    liver: {
      name: "Liver",
      canDonate: true,
      description: "Placeholder: The liver filters toxins and helps digestion. Partial liver donation is possible because it can regenerate.",
      impact: "Saves lives by restoring liver function; the liver can regenerate in donors.",
    },
    kidneys: {
      name: "Kidneys",
      canDonate: true,
      description: "The kidneys filter blood to remove waste, balance fluids, and produce urine. Donors can give one kidney while keeping the other, helping patients with kidney failure regain their health.",
      impact: "Restores kidney function and independence for those with kidney failure.",
    },
   
    pancrease: {
      name: "Pancreas",
      canDonate: true,
      description: "The pancreas produces insulin and digestive enzymes, regulating blood sugar and aiding digestion. Pancreas transplants are performed for patients with severe diabetes.",
      impact: "Helps patients with diabetes regain control over their blood sugar.",
    },
    stomach: {
      name: "Stomach",
      canDonate: false,
      description:
        "The stomach breaks down food into nutrients through acid and enzymes, starting the digestive process. While the stomach is rarely transplanted, it plays a crucial role in digestion and overall health.",
      impact: "Not typically donated, but supports medical research that saves lives.",
    },
  };

  export default ORGAN_INFO;