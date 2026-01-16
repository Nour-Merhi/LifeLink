<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\QuizLevel;
use App\Models\QuizQuestion;

class QuizLevelsSeeder extends Seeder
{
    public function run(): void
    {
        // Create 10 levels
        $levels = [];
        for ($i = 1; $i <= 10; $i++) {
            $xpAmount = 50 + ($i - 1) * 25; // 50, 75, 100, 125, 150, 175, 200, 225, 250, 275
            $levels[] = QuizLevel::updateOrCreate(
                ['number' => $i],
                ['name' => "Level {$i}", 'number' => $i, 'xp_amount' => $xpAmount]
            );
        }

        // Questions for each level - difficulty increases with level
        $questionsByLevel = $this->getQuestionsByLevel();

        foreach ($questionsByLevel as $levelNumber => $questions) {
            foreach ($questions as $questionData) {
                QuizQuestion::updateOrCreate(
                    [
                        'level' => $levelNumber,
                        'question' => $questionData['question']
                    ],
                    [
                        'level' => $levelNumber,
                        'question' => $questionData['question'],
                        'options' => json_encode($questionData['options']),
                        'correct_answer' => $questionData['correct_answer'],
                        'points' => 10 + ($levelNumber - 1) * 2, // Increasing points per level
                    ]
                );
            }
        }
    }

    private function getQuestionsByLevel(): array
    {
        return [
            1 => [
                ['question' => 'Which blood type is considered the universal donor?', 'options' => ['Blood type A+', 'Blood type B+', 'Blood type AB+', 'Blood type O-'], 'correct_answer' => 'Blood type O-'],
                ['question' => 'What is the minimum age requirement for blood donation in most countries?', 'options' => ['16 years', '17 years', '18 years', '21 years'], 'correct_answer' => '18 years'],
                ['question' => 'How often can a healthy adult donate whole blood?', 'options' => ['Every week', 'Every 2 weeks', 'Every 8 weeks', 'Every 6 months'], 'correct_answer' => 'Every 8 weeks'],
                ['question' => 'Which organ can be donated while the donor is still alive?', 'options' => ['Heart', 'Kidney', 'Liver (full)', 'Lungs'], 'correct_answer' => 'Kidney'],
                ['question' => 'What is the most common blood type?', 'options' => ['A+', 'B+', 'O+', 'AB+'], 'correct_answer' => 'O+'],
                ['question' => 'How long can donated blood be stored?', 'options' => ['7 days', '21 days', '42 days', '90 days'], 'correct_answer' => '42 days'],
                ['question' => 'What percentage of body weight does blood typically represent?', 'options' => ['5-7%', '7-8%', '8-10%', '10-12%'], 'correct_answer' => '7-8%'],
                ['question' => 'Which blood component is used to help with clotting?', 'options' => ['Red blood cells', 'Plasma', 'Platelets', 'White blood cells'], 'correct_answer' => 'Platelets'],
                ['question' => 'What is organ donation?', 'options' => ['Giving money to hospitals', 'Giving organs to save lives', 'Selling organs', 'Testing organs'], 'correct_answer' => 'Giving organs to save lives'],
                ['question' => 'How many lives can one organ donor potentially save?', 'options' => ['1', '3', '5', '8'], 'correct_answer' => '8'],
            ],
            2 => [
                ['question' => 'Which blood type is considered the universal recipient?', 'options' => ['O-', 'A+', 'AB+', 'B+'], 'correct_answer' => 'AB+'],
                ['question' => 'What is the minimum hemoglobin level required for blood donation?', 'options' => ['11.0 g/dL', '12.0 g/dL', '12.5 g/dL', '13.0 g/dL'], 'correct_answer' => '12.5 g/dL'],
                ['question' => 'Which organ transplant has the highest success rate?', 'options' => ['Kidney', 'Heart', 'Liver', 'Lung'], 'correct_answer' => 'Kidney'],
                ['question' => 'What is the waiting period after getting a tattoo before you can donate blood?', 'options' => ['No wait', '3 months', '6 months', '1 year'], 'correct_answer' => '3 months'],
                ['question' => 'Which condition would prevent someone from donating blood?', 'options' => ['High blood pressure (controlled)', 'Diabetes (controlled)', 'HIV positive', 'Allergies'], 'correct_answer' => 'HIV positive'],
                ['question' => 'What is the main function of red blood cells?', 'options' => ['Fight infection', 'Carry oxygen', 'Clot blood', 'Remove waste'], 'correct_answer' => 'Carry oxygen'],
                ['question' => 'How long does a kidney transplant surgery typically take?', 'options' => ['2-3 hours', '3-4 hours', '4-5 hours', '6-8 hours'], 'correct_answer' => '3-4 hours'],
                ['question' => 'What is plasma primarily composed of?', 'options' => ['Water', 'Blood cells', 'Proteins', 'Minerals'], 'correct_answer' => 'Water'],
                ['question' => 'Which organ requires the most urgent transplantation?', 'options' => ['Kidney', 'Heart', 'Liver', 'Pancreas'], 'correct_answer' => 'Heart'],
                ['question' => 'What is the maximum age to become an organ donor?', 'options' => ['No maximum age', '60 years', '70 years', '80 years'], 'correct_answer' => 'No maximum age'],
            ],
            3 => [
                ['question' => 'What is the Rh factor in blood typing?', 'options' => ['A protein on red blood cells', 'A type of antibody', 'A blood disease', 'A medication'], 'correct_answer' => 'A protein on red blood cells'],
                ['question' => 'Which blood component can be frozen for long-term storage?', 'options' => ['Red blood cells', 'Platelets', 'Plasma', 'White blood cells'], 'correct_answer' => 'Plasma'],
                ['question' => 'What is the leading cause of organ transplant rejection?', 'options' => ['Infection', 'Immune system response', 'Poor blood flow', 'Age mismatch'], 'correct_answer' => 'Immune system response'],
                ['question' => 'How many units of blood are typically collected in one donation?', 'options' => ['1 unit (450ml)', '2 units', '3 units', '4 units'], 'correct_answer' => '1 unit (450ml)'],
                ['question' => 'Which organ can regenerate after partial donation?', 'options' => ['Kidney', 'Heart', 'Liver', 'Lung'], 'correct_answer' => 'Liver'],
                ['question' => 'What is apheresis in blood donation?', 'options' => ['Whole blood donation', 'Separating blood components', 'Testing blood', 'Storing blood'], 'correct_answer' => 'Separating blood components'],
                ['question' => 'What percentage of the population is eligible to donate blood?', 'options' => ['About 20%', 'About 37%', 'About 50%', 'About 65%'], 'correct_answer' => 'About 37%'],
                ['question' => 'Which medication must be avoided before organ donation?', 'options' => ['Aspirin', 'Blood thinners', 'Antibiotics', 'Vitamins'], 'correct_answer' => 'Blood thinners'],
                ['question' => 'What is the most common type of organ transplant?', 'options' => ['Kidney', 'Liver', 'Heart', 'Lung'], 'correct_answer' => 'Kidney'],
                ['question' => 'How long can a donated liver be preserved before transplantation?', 'options' => ['6-8 hours', '12-15 hours', '18-24 hours', '48 hours'], 'correct_answer' => '12-15 hours'],
            ],
            4 => [
                ['question' => 'What is cross-matching in organ transplantation?', 'options' => ['Matching blood types', 'Testing compatibility between donor and recipient', 'Finding donors', 'Surgical procedure'], 'correct_answer' => 'Testing compatibility between donor and recipient'],
                ['question' => 'Which blood type can receive blood from any type?', 'options' => ['O-', 'O+', 'AB+', 'A+'], 'correct_answer' => 'AB+'],
                ['question' => 'What is HLA matching in organ transplantation?', 'options' => ['Blood type matching', 'Tissue type matching', 'Age matching', 'Size matching'], 'correct_answer' => 'Tissue type matching'],
                ['question' => 'How long do platelets last after donation?', 'options' => ['1-2 days', '5-7 days', '10-14 days', '30 days'], 'correct_answer' => '5-7 days'],
                ['question' => 'What is the primary risk of organ transplantation?', 'options' => ['Rejection', 'Infection', 'Bleeding', 'Anesthesia'], 'correct_answer' => 'Rejection'],
                ['question' => 'Which condition would temporarily defer blood donation?', 'options' => ['Recent travel to malaria area', 'Controlled diabetes', 'High cholesterol', 'Allergies'], 'correct_answer' => 'Recent travel to malaria area'],
                ['question' => 'What is the function of immunosuppressant drugs after transplant?', 'options' => ['Prevent infection', 'Prevent rejection', 'Increase blood flow', 'Reduce pain'], 'correct_answer' => 'Prevent rejection'],
                ['question' => 'How many blood donations are needed annually in the US?', 'options' => ['5 million', '13 million', '20 million', '30 million'], 'correct_answer' => '13 million'],
                ['question' => 'What is a living donor transplant?', 'options' => ['Donation after death', 'Donation from living person', 'Artificial organ', 'Animal organ'], 'correct_answer' => 'Donation from living person'],
                ['question' => 'Which organ transplant requires the most critical timing?', 'options' => ['Kidney', 'Heart', 'Liver', 'Cornea'], 'correct_answer' => 'Heart'],
            ],
            5 => [
                ['question' => 'What is the significance of ABO incompatibility in transplantation?', 'options' => ['It prevents all transplants', 'It requires special treatment protocols', 'It has no significance', 'It only affects blood'], 'correct_answer' => 'It requires special treatment protocols'],
                ['question' => 'What is plasmapheresis used for?', 'options' => ['Blood typing', 'Collecting plasma', 'Testing compatibility', 'Storing blood'], 'correct_answer' => 'Collecting plasma'],
                ['question' => 'What is the average lifespan of a transplanted kidney?', 'options' => ['5-10 years', '10-15 years', '15-20 years', '20+ years'], 'correct_answer' => '15-20 years'],
                ['question' => 'Which factor is most critical for organ preservation?', 'options' => ['Temperature', 'Humidity', 'Light', 'Pressure'], 'correct_answer' => 'Temperature'],
                ['question' => 'What is the role of UNOS in organ transplantation?', 'options' => ['Blood testing', 'Organ allocation network', 'Hospital management', 'Insurance'], 'correct_answer' => 'Organ allocation network'],
                ['question' => 'How does blood type affect organ compatibility?', 'options' => ['No effect', 'Some organs require matching', 'All organs require matching', 'Only affects blood'], 'correct_answer' => 'Some organs require matching'],
                ['question' => 'What is the cold ischemia time for organs?', 'options' => ['Time in storage', 'Surgery duration', 'Recovery time', 'Wait list time'], 'correct_answer' => 'Time in storage'],
                ['question' => 'Which organ has the shortest preservation time?', 'options' => ['Kidney', 'Liver', 'Heart', 'Pancreas'], 'correct_answer' => 'Heart'],
                ['question' => 'What percentage of people are Rh-positive?', 'options' => ['About 50%', 'About 65%', 'About 85%', 'About 95%'], 'correct_answer' => 'About 85%'],
                ['question' => 'What is the primary function of white blood cells?', 'options' => ['Carry oxygen', 'Fight infection', 'Clot blood', 'Remove waste'], 'correct_answer' => 'Fight infection'],
            ],
            6 => [
                ['question' => 'What is hyperacute rejection in organ transplantation?', 'options' => ['Rejection after months', 'Immediate rejection', 'Chronic rejection', 'No rejection'], 'correct_answer' => 'Immediate rejection'],
                ['question' => 'What is the significance of CMV status in transplantation?', 'options' => ['Blood type factor', 'Viral infection risk', 'Organ size', 'Age factor'], 'correct_answer' => 'Viral infection risk'],
                ['question' => 'How is organ allocation prioritized?', 'options' => ['By wealth', 'By medical urgency and compatibility', 'By age', 'By location only'], 'correct_answer' => 'By medical urgency and compatibility'],
                ['question' => 'What is the function of anticoagulants in blood storage?', 'options' => ['Prevent clotting', 'Increase shelf life', 'Improve quality', 'All of the above'], 'correct_answer' => 'Prevent clotting'],
                ['question' => 'What is a paired kidney exchange program?', 'options' => ['Donor-recipient swaps', 'Buying kidneys', 'Testing program', 'Storage system'], 'correct_answer' => 'Donor-recipient swaps'],
                ['question' => 'What is the role of tissue typing in transplantation?', 'options' => ['Matching organs', 'Matching immune systems', 'Matching blood types', 'Matching sizes'], 'correct_answer' => 'Matching immune systems'],
                ['question' => 'How does age affect organ donation eligibility?', 'options' => ['Strict age limits', 'Health matters more than age', 'Only young can donate', 'Only old can donate'], 'correct_answer' => 'Health matters more than age'],
                ['question' => 'What is the MELD score used for?', 'options' => ['Blood typing', 'Liver transplant priority', 'Kidney function', 'Heart health'], 'correct_answer' => 'Liver transplant priority'],
                ['question' => 'What is autologous blood donation?', 'options' => ['Donating for others', 'Donating for yourself', 'Donating to family', 'Regular donation'], 'correct_answer' => 'Donating for yourself'],
                ['question' => 'Which surgical technique is used for living kidney donation?', 'options' => ['Open surgery only', 'Laparoscopic', 'Robotic only', 'No surgery needed'], 'correct_answer' => 'Laparoscopic'],
            ],
            7 => [
                ['question' => 'What is graft-versus-host disease?', 'options' => ['Organ rejection', 'Donor cells attack recipient', 'Infection', 'Blood disorder'], 'correct_answer' => 'Donor cells attack recipient'],
                ['question' => 'What is the significance of panel-reactive antibodies?', 'options' => ['Blood type antibodies', 'Organ rejection risk indicator', 'Infection markers', 'Hormone levels'], 'correct_answer' => 'Organ rejection risk indicator'],
                ['question' => 'What is the role of perfusion in organ preservation?', 'options' => ['Cooling organs', 'Keeping organs oxygenated', 'Testing organs', 'Storing organs'], 'correct_answer' => 'Keeping organs oxygenated'],
                ['question' => 'How does HLA matching improve transplant outcomes?', 'options' => ['Reduces rejection risk', 'Increases organ size', 'Improves blood flow', 'Reduces cost'], 'correct_answer' => 'Reduces rejection risk'],
                ['question' => 'What is the difference between whole blood and component donation?', 'options' => ['Whole blood is separated', 'Components are separated immediately', 'No difference', 'Different blood types'], 'correct_answer' => 'Components are separated immediately'],
                ['question' => 'What is the significance of crossmatch testing?', 'options' => ['Blood type check', 'Final compatibility test', 'Organ size check', 'Age verification'], 'correct_answer' => 'Final compatibility test'],
                ['question' => 'How does cold storage affect organ viability?', 'options' => ['Increases viability time', 'Reduces metabolic activity', 'Prevents infection', 'All of the above'], 'correct_answer' => 'Reduces metabolic activity'],
                ['question' => 'What is the role of histocompatibility in transplantation?', 'options' => ['Blood matching', 'Tissue compatibility', 'Size matching', 'Age matching'], 'correct_answer' => 'Tissue compatibility'],
                ['question' => 'What is the significance of donor-recipient size matching?', 'options' => ['Not important', 'Critical for some organs', 'Only for children', 'Only for adults'], 'correct_answer' => 'Critical for some organs'],
                ['question' => 'How does immunosuppression work after transplantation?', 'options' => ['Strengthens immune system', 'Suppresses immune response', 'Kills bacteria', 'Increases blood flow'], 'correct_answer' => 'Suppresses immune response'],
            ],
            8 => [
                ['question' => 'What is the significance of ABO-incompatible transplantation protocols?', 'options' => ['Allows cross-type transplants', 'Prevents all transplants', 'No significance', 'Only for research'], 'correct_answer' => 'Allows cross-type transplants'],
                ['question' => 'What is the role of complement in hyperacute rejection?', 'options' => ['Prevents rejection', 'Mediates rejection', 'No role', 'Improves outcomes'], 'correct_answer' => 'Mediates rejection'],
                ['question' => 'How does ischemic preconditioning benefit organ transplantation?', 'options' => ['Increases rejection', 'Protects organ function', 'Reduces size', 'Increases cost'], 'correct_answer' => 'Protects organ function'],
                ['question' => 'What is the significance of donor-specific antibodies?', 'options' => ['Improve outcomes', 'Increase rejection risk', 'No significance', 'Only for blood'], 'correct_answer' => 'Increase rejection risk'],
                ['question' => 'What is machine perfusion in organ preservation?', 'options' => ['Cooling method', 'Pumping preservation solution', 'Testing method', 'Storage technique'], 'correct_answer' => 'Pumping preservation solution'],
                ['question' => 'How does sensitization affect transplant candidacy?', 'options' => ['Makes finding match easier', 'Makes finding match harder', 'No effect', 'Prevents transplant'], 'correct_answer' => 'Makes finding match harder'],
                ['question' => 'What is the significance of blood group compatibility in heart transplantation?', 'options' => ['Not required', 'Required for all', 'Required for some', 'Optional'], 'correct_answer' => 'Required for all'],
                ['question' => 'What is the role of plasmapheresis in desensitization?', 'options' => ['Removes antibodies', 'Adds antibodies', 'Tests blood', 'Stores blood'], 'correct_answer' => 'Removes antibodies'],
                ['question' => 'How does organ quality score affect allocation?', 'options' => ['No effect', 'Affects priority', 'Only for research', 'Only for certain organs'], 'correct_answer' => 'Affects priority'],
                ['question' => 'What is the significance of extended criteria donors?', 'options' => ['Expands donor pool', 'Restricts donors', 'No significance', 'Only for research'], 'correct_answer' => 'Expands donor pool'],
            ],
            9 => [
                ['question' => 'What is the mechanism of action of calcineurin inhibitors in transplantation?', 'options' => ['Prevent infection', 'Block T-cell activation', 'Increase blood flow', 'Reduce pain'], 'correct_answer' => 'Block T-cell activation'],
                ['question' => 'What is the significance of donor organ quality index?', 'options' => ['Predicts outcomes', 'Determines cost', 'Sets waiting time', 'No significance'], 'correct_answer' => 'Predicts outcomes'],
                ['question' => 'How does ex vivo organ perfusion improve outcomes?', 'options' => ['Tests organ function', 'Improves preservation', 'Reduces size', 'Increases cost only'], 'correct_answer' => 'Improves preservation'],
                ['question' => 'What is the role of B cells in organ rejection?', 'options' => ['Produce antibodies', 'Kill infected cells', 'Carry oxygen', 'Clot blood'], 'correct_answer' => 'Produce antibodies'],
                ['question' => 'What is the significance of cytokine profiles in rejection?', 'options' => ['Diagnostic markers', 'No significance', 'Only for research', 'Only for blood'], 'correct_answer' => 'Diagnostic markers'],
                ['question' => 'How does HLA-DR matching differ from HLA-A/B matching?', 'options' => ['Different loci', 'No difference', 'Only for research', 'Only for certain organs'], 'correct_answer' => 'Different loci'],
                ['question' => 'What is the significance of delayed graft function?', 'options' => ['Good outcome', 'Kidney needs dialysis initially', 'Complete failure', 'No significance'], 'correct_answer' => 'Kidney needs dialysis initially'],
                ['question' => 'How does donor age affect organ quality?', 'options' => ['No effect', 'Older organs have limitations', 'Only young work', 'Only old work'], 'correct_answer' => 'Older organs have limitations'],
                ['question' => 'What is the role of regulatory T cells in transplantation tolerance?', 'options' => ['Promote rejection', 'Suppress immune response', 'Increase infection', 'No role'], 'correct_answer' => 'Suppress immune response'],
                ['question' => 'What is the significance of pre-transplant desensitization protocols?', 'options' => ['Allows incompatible transplants', 'Prevents all transplants', 'No significance', 'Only for research'], 'correct_answer' => 'Allows incompatible transplants'],
            ],
            10 => [
                ['question' => 'What is the molecular mechanism of acute cellular rejection?', 'options' => ['T-cell mediated attack', 'Antibody attack', 'Infection', 'Blood clot'], 'correct_answer' => 'T-cell mediated attack'],
                ['question' => 'What is the significance of microchimerism in transplant tolerance?', 'options' => ['Donor cells persist in recipient', 'Complete rejection', 'Infection marker', 'No significance'], 'correct_answer' => 'Donor cells persist in recipient'],
                ['question' => 'How does gene expression profiling assist in rejection diagnosis?', 'options' => ['Predicts rejection', 'Determines blood type', 'Tests organ size', 'No use'], 'correct_answer' => 'Predicts rejection'],
                ['question' => 'What is the role of costimulatory blockade in immunosuppression?', 'options' => ['Prevents T-cell activation', 'Increases rejection', 'Causes infection', 'No role'], 'correct_answer' => 'Prevents T-cell activation'],
                ['question' => 'What is the significance of donor-derived cell-free DNA in monitoring?', 'options' => ['Early rejection detection', 'Blood type testing', 'Organ size measurement', 'No significance'], 'correct_answer' => 'Early rejection detection'],
                ['question' => 'How does immune memory affect re-transplantation?', 'options' => ['Increases rejection risk', 'Decreases risk', 'No effect', 'Prevents transplant'], 'correct_answer' => 'Increases rejection risk'],
                ['question' => 'What is the mechanism of antibody-mediated rejection?', 'options' => ['Complement activation', 'T-cell attack', 'Infection', 'Blood clot'], 'correct_answer' => 'Complement activation'],
                ['question' => 'What is the significance of HLA epitope matching in modern transplantation?', 'options' => ['More precise matching', 'No difference', 'Only for research', 'Only for blood'], 'correct_answer' => 'More precise matching'],
                ['question' => 'How does organ age affect ischemic tolerance?', 'options' => ['No effect', 'Older organs less tolerant', 'Only young work', 'Only old work'], 'correct_answer' => 'Older organs less tolerant'],
                ['question' => 'What is the role of mesenchymal stem cells in transplantation research?', 'options' => ['Promote tolerance', 'Cause rejection', 'No role', 'Only for testing'], 'correct_answer' => 'Promote tolerance'],
            ],
        ];
    }
}
