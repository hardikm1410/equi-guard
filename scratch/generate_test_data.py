import pandas as pd
import numpy as np
import random

def generate_complex_dataset(num_samples=1000):
    np.random.seed(42)
    
    # Categories
    genders = ['Male', 'Female', 'Non-Binary']
    races = ['White', 'Black', 'Asian', 'Hispanic', 'Other']
    locations = ['Urban', 'Suburban', 'Rural']
    
    data = []
    
    for i in range(num_samples):
        # Protected Attributes
        gender = np.random.choice(genders, p=[0.48, 0.48, 0.04])
        race = np.random.choice(races, p=[0.6, 0.12, 0.15, 0.1, 0.03])
        age = np.random.randint(22, 65)
        location = np.random.choice(locations)
        
        # Qualifications
        years_exp = np.random.randint(0, 25)
        # University prestige (lower is better)
        uni_rank = np.random.randint(1, 200)
        
        # Skill Scores (0-100)
        coding_score = np.random.normal(70, 15)
        coding_score = np.clip(coding_score, 0, 100)
        
        interview_score = np.random.normal(65, 20)
        interview_score = np.clip(interview_score, 0, 100)
        
        # Injecting Bias into the Ground Truth ('hired')
        # Baseline probability
        prob = 0.3 
        
        # Experience and coding score increase probability
        prob += (years_exp / 25) * 0.3
        prob += (coding_score / 100) * 0.2
        
        # Inject Bias: Gender Bias (favoring Male)
        if gender == 'Male':
            prob += 0.15
        elif gender == 'Female':
            prob -= 0.05
            
        # Inject Bias: Race Bias (favoring Asian/White)
        if race in ['Asian', 'White']:
            prob += 0.1
        elif race == 'Black':
            prob -= 0.1
            
        # Inject Bias: Age Bias (favoring younger)
        if age > 50:
            prob -= 0.15
            
        # Clip probability
        prob = np.clip(prob, 0.05, 0.95)
        
        # Final decision
        hired = 1 if np.random.random() < prob else 0
        
        # Mocking Model Predictions (often even more biased than ground truth)
        pred_prob = prob
        # Model over-indexes on University Rank for White candidates
        if race == 'White' and uni_rank < 50:
            pred_prob += 0.2
        # Model under-indexes on coding score for Minority groups
        if race in ['Black', 'Hispanic']:
            pred_prob -= 0.1
            
        pred_prob = np.clip(pred_prob, 0, 1)
        prediction = 1 if np.random.random() < pred_prob else 0
        
        data.append({
            'candidate_id': f'C-{i+1000:04}',
            'gender': gender,
            'race': race,
            'age': age,
            'location': location,
            'years_experience': years_exp,
            'university_rank': uni_rank,
            'coding_score': round(coding_score, 1),
            'interview_score': round(interview_score, 1),
            'hired': hired,
            'prediction': prediction
        })
        
    df = pd.DataFrame(data)
    return df

# Create the dataset
df = generate_complex_dataset(2000)
df.to_csv('equiguard_complex_test.csv', index=False)
print("Dataset 'equiguard_complex_test.csv' generated with 2000 samples.")
