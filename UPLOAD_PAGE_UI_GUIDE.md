# Upload Page - UI Component Guide

## 🎨 Visual Layout Structure

```
┌─────────────────────────────────────────┐
│  📱 Upload Screen                       │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║  Create Post              🗑️     ║ │ ← Header with Clear button
│  ╠═══════════════════════════════════╣ │
│  ║                                   ║ │
│  ║  ┌─────────────────────────────┐ ║ │
│  ║  │ What's happening?...        │ ║ │ ← Text Input (120px min height)
│  ║  │                             │ ║ │
│  ║  │                             │ ║ │
│  ║  │                      45/500 │ ║ │ ← Character Counter
│  ║  └─────────────────────────────┘ ║ │
│  ║                                   ║ │
│  ║  💡 Tip: Use hashtags...         ║ │ ← Hint Text
│  ║                                   ║ │
│  ║  ┌──────────┐  ┌──────────┐     ║ │
│  ║  │ 📷 Gallery│  │ 📷 Camera│     ║ │ ← Image Picker Buttons
│  ║  └──────────┘  └──────────┘     ║ │
│  ║                                   ║ │
│  ║  Category                         ║ │
│  ║  ┌───┐ ┌─────┐ ┌────┐ ┌────┐   ║ │
│  ║  │All│ │Level│ │Dept│ │Exam│...║ │ ← Category Chips (scrollable)
│  ║  └───┘ └─────┘ └────┘ └────┘   ║ │
│  ║                                   ║ │
│  ║  Target Audience (Optional) 🎓   ║ │
│  ║  ┌────────┐ ┌────┐ ┌────┐       ║ │
│  ║  │Everyone│ │CSC │ │ENG │ ...  ║ │ ← Department Selection
│  ║  └────────┘ └────┘ └────┘       ║ │
│  ║  ─────────────────────────────   ║ │
│  ║  Select Level                     ║ │
│  ║  ┌────┐ ┌────┐ ┌────┐ ┌────┐   ║ │
│  ║  │100L│ │200L│ │300L│ │400L│   ║ │ ← Level Selection (conditional)
│  ║  └────┘ └────┘ └────┘ └────┘   ║ │
│  ║                                   ║ │
│  ║  ┌───────────────────────────┐   ║ │
│  ║  │ 👁️ Show Preview           │   ║ │ ← Preview Toggle (dashed border)
│  ║  └───────────────────────────┘   ║ │
│  ║                                   ║ │
│  ║  ┌───────────────────────────┐   ║ │
│  ║  │ ✉️ Publish Post            │   ║ │ ← Submit Button (with shadow)
│  ║  └───────────────────────────┘   ║ │
│  ║                                   ║ │
│  ║  ℹ️ This post will be visible... ║ │ ← Helper Text
│  ╚═══════════════════════════════════╝ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🖼️ Image Preview State

```
┌─────────────────────────────────────────┐
│  When Image is Selected:                │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║                              ╔══╗ ║ │
│  ║  ┌────────────────────────┐  ║❌║ ║ │ ← Remove Image
│  ║  │                        │  ║🔄║ ║ │ ← Replace Image
│  ║  │                        │  ╚══╝ ║ │
│  ║  │    [Image Preview]     │       ║ │
│  ║  │     240px height       │       ║ │
│  ║  │                        │       ║ │
│  ║  │                        │       ║ │
│  ║  └────────────────────────┘       ║ │
│  ║  ┌─────┐                          ║ │
│  ║  │245KB│ ← Image Size Badge       ║ │
│  ║  └─────┘                          ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎬 Post Preview State

```
┌─────────────────────────────────────────┐
│  When Preview is Enabled:               │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║  ┌───────────────────────────┐   ║ │
│  ║  │ 👁️ Hide Preview           │   ║ │
│  ║  └───────────────────────────┘   ║ │
│  ║                                   ║ │
│  ║  ╭───────────────────────────╮   ║ │
│  ║  │ PREVIEW                   │   ║ │
│  ║  ├───────────────────────────┤   ║ │
│  ║  │ This is my post text...   │   ║ │
│  ║  │                           │   ║ │
│  ║  │ ┌─────────────────────┐   │   ║ │
│  ║  │ │  [Image Preview]    │   │   ║ │
│  ║  │ │   160px height      │   │   ║ │
│  ║  │ └─────────────────────┘   │   ║ │
│  ║  │                           │   ║ │
│  ║  │ Exam • CSC • 200L         │   ║ │ ← Metadata
│  ║  ╰───────────────────────────╯   ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 Color States & Visual Feedback

### Character Counter Colors

```
Normal State (0-400 chars):
┌──────────┐
│   45/500 │ ← Muted Gray (#90CAF9 dark / #607D8B light)
└──────────┘

Warning State (401-500 chars):
┌──────────┐
│  485/500 │ ← Orange (#FFA726 dark / #FF9800 light)
└──────────┘

Error State (501+ chars):
┌──────────┐
│  532/500 │ ← Red (#EF5350 dark / #F44336 light)
└──────────┘
+ Submit button disabled
```

### Chip States

```
Inactive Chip:
┌─────────┐
│  Level  │ ← Gray border, muted text
└─────────┘

Active Chip:
┌─────────┐
│  Level  │ ← Blue border, blue background, white/blue text
└─────────┘

Level Chip Active:
┌─────────┐
│  200L   │ ← Green border, green background, green text
└─────────┘
```

### Button States

```
Normal Submit:
┌───────────────────┐
│ ✉️ Publish Post   │ ← Blue background, white text, shadow
└───────────────────┘

Loading Submit:
┌───────────────────┐
│ ⏳ Publishing...  │ ← Blue background, spinner
└───────────────────┘

Over Limit:
┌───────────────────┐
│ ✉️ Publish Post   │ ← Red background, disabled, no shadow
└───────────────────┘
```

---

## 📏 Spacing & Dimensions

### Component Sizes
```
Card Padding:           16px
Section Margins:        16px bottom
Title Font:            20px, bold
Input Height:          120px minimum
Button Height:         52px
Chip Height:           ~36px (9px padding top/bottom)
Icon Size:             18px
Image Preview:         240px height
Preview Image:         160px height
Touch Target:          48px minimum
```

### Gap Spacing
```
Horizontal Chips:      8px gap
Image Buttons:         8px gap
Image Actions:         8px gap
Section Elements:      8-12px
```

---

## 🎯 Interactive Elements

### Touchable Areas

```
1. Header Clear Button (Top Right)
   Size: 34px × 34px
   Action: Clear all content with confirmation

2. Image Picker Buttons (Gallery / Camera)
   Size: Full width (50% each with gap)
   Height: 48px
   Action: Open picker / Launch camera

3. Category Chips
   Size: Auto width, 36px height
   Action: Select category

4. Department Chips
   Size: Auto width, 36px height
   Action: Select department

5. Level Chips
   Size: Auto width, 36px height
   Action: Select level

6. Preview Toggle
   Size: Full width, 44px height
   Action: Show/hide preview

7. Submit Button
   Size: Full width, 52px height
   Action: Publish post
```

---

## 🌈 Theme Support

### Light Mode
```
Background:    #E6F4FE (Light Blue)
Card:          #FFFFFF (White)
Text:          #0A1929 (Dark Blue)
Muted:         #607D8B (Blue Grey)
Border:        rgba(25,118,210,0.15)
Primary:       #1976D2 (Blue)
```

### Dark Mode
```
Background:    #0A1929 (Dark Blue)
Card:          #0F213A (Darker Blue)
Text:          #FFFFFF (White)
Muted:         #90CAF9 (Light Blue)
Border:        rgba(66,165,245,0.25)
Primary:       #64B5F6 (Light Blue)
```

---

## 📱 Responsive Behavior

### Keyboard Interaction
```
1. Keyboard appears → Content scrolls
2. Text input focused → Auto-scroll to input
3. Submit tapped → Keyboard dismisses
4. Category scrolls → Keyboard stays open
```

### ScrollView Behavior
```
1. Main ScrollView (Vertical)
   - Contains all content
   - Keyboard-aware
   - Bounce enabled

2. Category ScrollView (Horizontal)
   - Shows horizontal scroll indicator: false
   - Snap to items: false

3. Department ScrollView (Horizontal)
   - Shows horizontal scroll indicator: false

4. Level ScrollView (Horizontal)
   - Shows horizontal scroll indicator: false
```

---

## 🔔 Toast Notifications

### Success Toasts
```
✅ "Image selected successfully!"
✅ "Photo captured!"
✅ "Post cleared"
✅ "Draft restored"
✅ "Your post has been published! 🎉"
```

### Warning Toasts
```
⚠️ "Please allow photo access..."
⚠️ "Please allow camera access..."
⚠️ "Add some text or an image..."
⚠️ "Post is too long..."
⚠️ "Please select a level..."
```

### Error Toasts
```
❌ "Failed to publish post"
❌ API error messages
```

---

## 🎭 Dialog Alerts

### Resume Draft Dialog
```
┌─────────────────────────────┐
│  Resume Draft?              │
├─────────────────────────────┤
│  You have an unsaved draft. │
│  Would you like to continue │
│  editing it?                │
├─────────────────────────────┤
│  [Discard]      [Resume]    │
└─────────────────────────────┘
```

### Clear Post Dialog
```
┌─────────────────────────────┐
│  Clear Post?                │
├─────────────────────────────┤
│  This will remove all       │
│  content. Are you sure?     │
├─────────────────────────────┤
│  [Cancel]       [Clear]     │
└─────────────────────────────┘
```

---

## 🎨 Icon Reference

```
Header Icons:
🗑️  trash-outline        (Clear button)

Image Icons:
📷  image                (Gallery button)
📷  camera               (Camera button)
❌  close                (Remove image)
🔄  refresh              (Replace image)

Preview Icons:
👁️  eye-outline          (Show preview)
🙈  eye-off-outline      (Hide preview)

Submit Icon:
✉️  send                 (Publish button)

Section Icons:
🎓  school-outline       (Target Audience label)

Activity:
⏳  ActivityIndicator    (Loading spinner)
```

---

## 💡 Design Philosophy

### 1. **Progressive Disclosure**
Only show level selection when department is selected

### 2. **Clear Visual Hierarchy**
Title (20px) → Section Labels (14px) → Body (15px) → Helper (12px)

### 3. **Immediate Feedback**
Every action gets instant visual or haptic feedback

### 4. **Error Prevention**
Validation before submission, character counter, confirmations

### 5. **Consistency**
All chips, buttons, and inputs follow same design pattern

### 6. **Accessibility First**
High contrast, large touch targets, clear labels

---

## 🎓 Best Practices Used

✅ **Touch Targets**: Minimum 48px for accessibility  
✅ **Color Contrast**: WCAG AA compliant  
✅ **Feedback**: Visual response to every interaction  
✅ **Loading States**: Never leave user wondering  
✅ **Error Messages**: Clear, actionable, friendly  
✅ **Spacing**: Consistent rhythm throughout  
✅ **Typography**: Clear hierarchy and readability  
✅ **Icons**: Paired with text for clarity  

---

This UI guide helps you understand every visual element and interaction in the new professional upload page! 🎨✨
