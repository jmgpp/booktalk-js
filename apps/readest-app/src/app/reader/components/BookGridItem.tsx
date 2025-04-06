'use client';

import clsx from 'clsx';
import React from 'react';

import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useReaderStore } from '@/store/readerStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useSidebarStore } from '@/store/sidebarStore';
import FoliateViewer from './FoliateViewer';
import SectionInfo from './SectionInfo';
import HeaderBar from './HeaderBar';
import FooterBar from './FooterBar';
import PageInfoView from './PageInfo';
import Ribbon from './Ribbon';
import SettingsDialog from './settings/SettingsDialog';
import Annotator from './annotator/Annotator';
import FootnotePopup from './FootnotePopup';
import HintInfo from './HintInfo';
import DoubleBorder from './DoubleBorder';

interface BookGridItemProps {
  bookKey: string;
  index: number; // Pass index if needed for layout/logic (e.g., HeaderBar isTopLeft)
  bookKeysLength: number; // Pass total length if needed (e.g., HeaderBar isHoveredAnim)
  onCloseBook: (bookKey: string) => void;
}

const BookGridItem: React.FC<BookGridItemProps> = ({ 
  bookKey, 
  index, 
  bookKeysLength, 
  onCloseBook 
}) => {
  const { appService } = useEnv();
  const { isSideBarVisible } = useSidebarStore();
  const { isFontLayoutSettingsDialogOpen, setFontLayoutSettingsDialogOpen } = useSettingsStore();

  // --- Use direct store subscriptions --- 
  const bookData = useBookDataStore(state => state.getBookData(bookKey));
  const config = useBookDataStore(state => state.getConfig(bookKey));
  const progress = useReaderStore(state => state.getProgress(bookKey));
  const viewState = useReaderStore(state => state.getViewState(bookKey));
  const viewSettings = viewState?.viewSettings;
  const isBookmarked = viewState?.ribbonVisible;
  const { book, bookDoc } = bookData || {};

  console.log(`[BookGridItem ${bookKey}] Rendering. Data Status:`, {
    hasBook: !!book,
    hasConfig: !!config,
    hasBookDoc: !!bookDoc,
    hasViewSettings: !!viewSettings
  });

  // Loading Check
  if (!book || !config || !bookDoc || !viewSettings) { 
      console.warn(`[BookGridItem ${bookKey}] Missing required data. Rendering loading placeholder.`);
      // Keep rendering a placeholder div with the key to maintain grid structure
      return <div key={bookKey} id={`gridcell-loading-${bookKey}`}>Loading {bookKey}...</div>; 
  }

  // Data is ready, proceed with rendering
  const { section, pageinfo, sectionLabel } = progress || {};
  const horizontalGapPercent = viewSettings.gapPercent;
  const verticalMarginPixels = viewSettings.marginPx;

  return (
    <div
      id={`gridcell-${bookKey}`}
      key={bookKey} // React key needed here
      className={clsx(
        'relative h-full w-full overflow-hidden',
        !isSideBarVisible && appService?.hasRoundedWindow && 'rounded-window',
      )}
    >
      {isBookmarked && <Ribbon width={`${horizontalGapPercent}%`} />}
      <HeaderBar
        bookKey={bookKey}
        bookTitle={book.title}
        isTopLeft={index === 0}
        isHoveredAnim={bookKeysLength > 2}
        onCloseBook={onCloseBook}
        onSetSettingsDialogOpen={setFontLayoutSettingsDialogOpen}
      />
      <FoliateViewer bookKey={bookKey} bookDoc={bookDoc} config={config} />
      {viewSettings.vertical && viewSettings.scrolled && (
        <>
          {/* Left/Right gaps */}
          <div className='bg-base-100 absolute left-0 top-0 h-full' style={{ width: `calc(${horizontalGapPercent}%)`, height: `calc(100% - ${verticalMarginPixels}px)` }} />
          <div className='bg-base-100 absolute right-0 top-0 h-full' style={{ width: `calc(${horizontalGapPercent}%)`, height: `calc(100% - ${verticalMarginPixels}px)` }} />
        </>
      )}
      {viewSettings.vertical && viewSettings.doubleBorder && (
        <DoubleBorder
          showHeader={viewSettings.showHeader}
          showFooter={viewSettings.showFooter}
          borderColor={viewSettings.borderColor}
          horizontalGap={horizontalGapPercent}
          verticalMargin={verticalMarginPixels}
        />
      )}
      {viewSettings.showHeader && (
        <SectionInfo
          section={sectionLabel}
          showDoubleBorder={viewSettings.vertical && viewSettings.doubleBorder}
          isScrolled={viewSettings.scrolled}
          isVertical={viewSettings.vertical}
          horizontalGap={horizontalGapPercent}
          verticalMargin={verticalMarginPixels}
        />
      )}
      <HintInfo
        bookKey={bookKey}
        showDoubleBorder={viewSettings.vertical && viewSettings.doubleBorder}
        isVertical={viewSettings.vertical}
        horizontalGap={horizontalGapPercent}
        verticalMargin={verticalMarginPixels}
      />
      {viewSettings.showFooter && (
        <PageInfoView
          bookFormat={book.format}
          section={section}
          pageinfo={pageinfo}
          showDoubleBorder={viewSettings.vertical && viewSettings.doubleBorder}
          isScrolled={viewSettings.scrolled}
          isVertical={viewSettings.vertical}
          horizontalGap={horizontalGapPercent}
          verticalMargin={verticalMarginPixels}
        />
      )}
      <Annotator bookKey={bookKey} />
      <FootnotePopup bookKey={bookKey} bookDoc={bookDoc} />
      <FooterBar
        bookKey={bookKey}
        bookFormat={book.format}
        section={section}
        pageinfo={pageinfo}
        isHoveredAnim={false} // Keep as false or adjust based on logic if needed
      />
      {isFontLayoutSettingsDialogOpen && <SettingsDialog bookKey={bookKey} config={config} />}
    </div>
  );
};

export default BookGridItem; 