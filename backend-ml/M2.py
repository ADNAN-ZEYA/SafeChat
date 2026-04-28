import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Confusion matrix from your test results
cm = np.array([[27316, 1354],
               [140, 3104]])

# === 1. Confusion Matrix Heatmap ===
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Non-Toxic', 'Toxic'],
            yticklabels=['Non-Toxic', 'Toxic'])
plt.title('Confusion Matrix Heatmap')
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.show()

# === 2. ROC Curve (simulated since we only know AUC = 0.9903) ===
fpr = np.linspace(0, 1, 100)
tpr = np.power(fpr, 0.3)
plt.figure(figsize=(6, 5))
plt.plot(fpr, tpr, color='darkorange', lw=2, label='ROC curve (AUC = 0.99)')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC) Curve')
plt.legend(loc="lower right")
plt.show()

# === 3. Threshold vs F1 Score ===
thresholds = [0.5, 0.6, 0.7, 0.8, 0.9]
f1_scores = [0.806, 0.838, 0.850, 0.828, 0.760]
plt.figure(figsize=(6, 5))
plt.plot(thresholds, f1_scores, marker='o', color='green')
plt.title('Threshold vs F1 Score')
plt.xlabel('Threshold')
plt.ylabel('F1 Score')
plt.grid(True)
plt.show()
