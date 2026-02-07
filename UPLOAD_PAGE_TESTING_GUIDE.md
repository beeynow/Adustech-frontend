# Upload Page - Testing Guide

## 🧪 Quick Testing Checklist

Use this guide to test all the new features in the upload page.

---

## ✅ Pre-Testing Setup

1. **Start the Expo App**
   ```bash
   cd adustech
   npm start
   # or
   npx expo start
   ```

2. **Ensure Backend is Running**
   - Backend should be accessible
   - Departments should be created in the system
   - User should be logged in

3. **Clear App Storage (Optional)**
   ```bash
   # For testing draft functionality from scratch
   # In app: Settings → Clear App Data
   ```

---

## 🎯 Feature Testing Matrix

### 1. Character Counter
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Normal typing | Type 0-400 characters | Gray counter shows: `X/500` |
| Near limit | Type 401-500 characters | Orange counter shows warning |
| Over limit | Type 501+ characters | Red counter, submit button disabled |
| Delete text | Delete to bring under 500 | Counter returns to normal, button enabled |

### 2. Draft Auto-Save
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Type and close | Type text, close app, reopen | "Resume Draft?" dialog appears |
| Resume draft | Click "Resume" in dialog | Text is restored |
| Discard draft | Click "Discard" in dialog | Start with empty form |
| Old draft | Wait 24+ hours, reopen app | No draft dialog (expired) |
| Successful post | Type, publish, reopen | No draft dialog (cleared) |

### 3. Image Handling
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Gallery permission | Click Gallery, deny permission | Warning toast appears |
| Gallery pick | Click Gallery, allow, select image | Image preview shows with size badge |
| Camera permission | Click Camera, deny permission | Warning toast appears |
| Camera capture | Click Camera, allow, take photo | Photo preview shows |
| Remove image | Click ❌ on preview | Image removed, buttons return |
| Replace image | Click 🔄 on preview | Gallery opens, can select new image |
| Image size | Add large image | Size shown in KB at bottom-left |

### 4. Category Selection
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Select category | Tap any category chip | Chip highlights with blue border/background |
| Switch category | Tap different category | New category active, old deselected |
| Scroll categories | Swipe category list | Horizontal scroll works smoothly |

### 5. Department Targeting
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Default state | Open page | "Everyone" is selected |
| Select department | Click a department chip | Department highlights, level section appears |
| Switch department | Click different department | New levels load for that department |
| Deselect department | Click "Everyone" | Level section disappears |
| No departments | Backend has no departments | Loading indicator or empty state |

### 6. Level Selection
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Level visibility | Select department | Level chips appear below |
| Select level | Click a level chip | Level highlights with green border |
| Switch level | Click different level | New level active |
| Post without level | Select dept, don't select level, submit | Warning: "Please select a level..." |

### 7. Post Preview
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Show preview | Click "Show Preview" | Preview card appears with content |
| Hide preview | Click "Hide Preview" | Preview card disappears |
| Preview content | Type text and add image | Both show in preview |
| Preview metadata | Select category, dept, level | Shows: "Exam • CSC • 200L" |
| No content | Click preview with no content | Preview button not visible |

### 8. Clear All
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Clear button visibility | Add any content | 🗑️ icon appears in header |
| Click clear | Click trash icon | Confirmation dialog appears |
| Cancel clear | Click "Cancel" | Content remains |
| Confirm clear | Click "Clear" | All fields reset, success toast |

### 9. Validation
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Empty submit | Click Publish with no content | Warning: "Nothing to Post" |
| Text only | Type text, submit | Post publishes successfully |
| Image only | Add image, submit | Post publishes successfully |
| Over limit submit | Type 501+ chars, click submit | Button disabled, can't submit |
| Dept without level | Select dept, submit without level | Warning: "Level Required" |

### 10. Post Submission
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Normal submit | Add content, click Publish | Loading state, then success toast |
| During loading | Click Publish, click again | Button disabled during upload |
| Success | Post publishes | Form clears, draft deleted, success toast |
| Error | Publish with backend down | Error toast with message |

---

## 🎨 Visual Testing

### Dark Mode
1. Switch device to dark mode
2. Check all colors invert properly
3. Verify text readability
4. Check button contrast

### Light Mode
1. Switch device to light mode
2. Verify all elements visible
3. Check contrast ratios
4. Ensure borders are visible

### Both Modes
- [ ] Character counter colors (gray → orange → red)
- [ ] Active chip highlighting
- [ ] Button shadows and states
- [ ] Image preview overlay buttons
- [ ] Preview card background
- [ ] Helper text visibility

---

## 📱 Device Testing

### Small Screen (iPhone SE, small Android)
- [ ] All buttons are touchable
- [ ] Text doesn't overflow
- [ ] Horizontal scrolls work
- [ ] Keyboard doesn't hide content

### Medium Screen (iPhone 12, standard Android)
- [ ] Optimal layout spacing
- [ ] All features accessible
- [ ] Comfortable touch targets

### Large Screen (iPad, tablets)
- [ ] Layout scales appropriately
- [ ] No excessive white space
- [ ] Images scale well

---

## ⚡ Performance Testing

### Speed Tests
| Action | Expected Time | Notes |
|--------|---------------|-------|
| Page load | < 500ms | Including department fetch |
| Draft save | Instant | Debounced 1s after typing |
| Image select | < 2s | Includes compression |
| Camera launch | < 1s | Native speed |
| Post submit | 2-5s | Depends on image size |
| Preview toggle | Instant | UI only |

### Memory Tests
1. Upload 10 posts in a row
2. Check for memory leaks
3. Monitor app performance
4. Ensure smooth scrolling

---

## 🐛 Edge Cases

### Test These Scenarios:

1. **Network Issues**
   - [ ] No internet on page load
   - [ ] Internet drops during submit
   - [ ] Slow connection handling

2. **Permission Issues**
   - [ ] Camera permission denied
   - [ ] Gallery permission denied
   - [ ] Permission revoked mid-use

3. **Content Edge Cases**
   - [ ] Exactly 500 characters
   - [ ] Empty spaces only
   - [ ] Special characters (emoji, symbols)
   - [ ] Very long words
   - [ ] Multiple line breaks

4. **Department Edge Cases**
   - [ ] Department with no levels
   - [ ] Department deleted while selected
   - [ ] User not in any department

5. **Image Edge Cases**
   - [ ] Very large image (10MB+)
   - [ ] Small image (< 50KB)
   - [ ] Unusual aspect ratios
   - [ ] Corrupted image file

6. **Draft Edge Cases**
   - [ ] Multiple app restarts
   - [ ] Draft older than 24 hours
   - [ ] Multiple drafts (shouldn't happen)
   - [ ] Draft with special characters

---

## 🔍 Accessibility Testing

### Screen Reader Testing
1. Enable VoiceOver (iOS) / TalkBack (Android)
2. Navigate through all elements
3. Verify all buttons announce correctly
4. Check form input labels

### Touch Target Testing
1. Use accessibility inspector
2. Verify all targets ≥ 48px
3. Check spacing between buttons
4. Test with large text enabled

### Color Blind Testing
1. Use color blind simulator
2. Ensure features don't rely on color alone
3. Check icon + text combinations
4. Verify contrast ratios

---

## 📊 Success Metrics

After testing, verify:

- [ ] **Usability**: All features intuitive and easy to use
- [ ] **Performance**: No lag or stuttering
- [ ] **Reliability**: No crashes or freezes
- [ ] **Accessibility**: Usable by all users
- [ ] **Visual Polish**: Professional appearance
- [ ] **Error Handling**: Graceful error messages
- [ ] **Feedback**: Clear user feedback for all actions

---

## 🚨 Common Issues & Solutions

### Issue: Character counter not updating
**Solution**: Check text state binding, ensure onChange is connected

### Issue: Draft not loading
**Solution**: Clear AsyncStorage, check 24-hour expiry logic

### Issue: Image too large
**Solution**: Compression is at 70%, may need to reduce further

### Issue: Department list empty
**Solution**: Ensure backend has departments, check API call

### Issue: Submit button stays disabled
**Solution**: Check validation logic, character count

### Issue: Preview not showing
**Solution**: Verify showPreview state toggle, check conditional rendering

---

## 🎯 Quick Smoke Test (5 minutes)

For rapid testing, run this quick flow:

1. ✅ Open upload page
2. ✅ Type 50 characters (check counter)
3. ✅ Add image from gallery
4. ✅ Select category: "Exam"
5. ✅ Select department: Any
6. ✅ Select level: Any
7. ✅ Toggle preview on/off
8. ✅ Click Publish
9. ✅ Verify success toast
10. ✅ Reopen page (check draft cleared)

**Expected Time**: 3-5 minutes  
**Pass Criteria**: All steps work without errors

---

## 📝 Bug Reporting Template

If you find a bug, report it with:

```markdown
**Feature**: [Which feature has the issue]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 
**Actual Result**: 
**Device**: [iOS/Android, version]
**App Version**: 
**Screenshots**: [If applicable]
**Console Errors**: [If any]
```

---

## 🎉 Testing Complete!

Once all tests pass:
- ✅ Upload page is production-ready
- ✅ All features working as designed
- ✅ Professional user experience
- ✅ Accessible to all users
- ✅ Performance optimized

**Happy Testing!** 🚀

---

**Last Updated**: February 2026  
**Test Coverage**: 15+ features, 50+ test cases  
**Quality Standard**: Production-ready
